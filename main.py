import json
import os
import subprocess
import traceback
from os.path import expanduser

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code one directory up
# or add the `decky-loader/plugin` path to `python.analysis.extraPaths` in `.vscode/settings.json`
import decky_plugin

HOME = expanduser("~")
VENV_PYTHON = f"{HOME}/.pyenv/versions/decky-spy/bin/python"


class Plugin:
    VERSION = decky_plugin.DECKY_PLUGIN_VERSION

    async def get_version(self):
        return json.dumps({"code": 0, "data": self.VERSION})

    async def cli(self, command, args="") -> str:
        # await Plugin.logPy(self, f"cli call: {command}")
        try:
            out = subprocess.check_output(
                f"{VENV_PYTHON} {os.path.dirname(__file__)}/deckyspy/cli.py {command} {args}",
                stderr=subprocess.STDOUT,
                shell=True,
            ).decode()
            # await Plugin.logPy(self, f"stdout capture: {out}")
            return json.dumps({"code": 0, "data": out})
        except:
            except_info = traceback.format_exc()
            await Plugin.logPy(self, f"exception info: {except_info}")
            return json.dumps({"code": 1, "data": except_info})

    async def get_memory(self):
        return await Plugin.cli(self, "get-memory")

    async def get_top_k_mem_procs(self, k=1):
        return await Plugin.cli(self, "get-top-k-mem-procs", f"--k={k}")

    async def get_uptime(self):
        return await Plugin.cli(self, "get-uptime")

    async def get_battery(self):
        return await Plugin.cli(self, "get-battery")

    async def log(self, message):
        decky_plugin.logger.info("[DeckySpy]" + message)

    async def logPy(self, message):
        decky_plugin.logger.info("[DeckySpy][PyBackend]" + message)

    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        await Plugin.logPy(self, f"Load Decky Spy ver{self.VERSION}")

    # Function called first during the unload process, utilize this to handle your plugin being removed
    async def _unload(self):
        await Plugin.logPy(self, "Unload Decky Spy")

    # Migrations that should be performed before entering `_main()`.
    async def _migration(self):
        await Plugin.logPy(self, "Migrating")
        # Here's a migration example for logs:
        # - `~/.config/decky-template/template.log` will be migrated to `decky_plugin.DECKY_PLUGIN_LOG_DIR/template.log`
        decky_plugin.migrate_logs(
            os.path.join(
                decky_plugin.DECKY_USER_HOME,
                ".config",
                "decky-template",
                "template.log",
            )
        )
        # Here's a migration example for settings:
        # - `~/homebrew/settings/template.json` is migrated to `decky_plugin.DECKY_PLUGIN_SETTINGS_DIR/template.json`
        # - `~/.config/decky-template/` all files and directories under this root are migrated to `decky_plugin.DECKY_PLUGIN_SETTINGS_DIR/`
        decky_plugin.migrate_settings(
            os.path.join(decky_plugin.DECKY_HOME, "settings", "template.json"),
            os.path.join(decky_plugin.DECKY_USER_HOME, ".config", "decky-template"),
        )
        # Here's a migration example for runtime data:
        # - `~/homebrew/template/` all files and directories under this root are migrated to `decky_plugin.DECKY_PLUGIN_RUNTIME_DIR/`
        # - `~/.local/share/decky-template/` all files and directories under this root are migrated to `decky_plugin.DECKY_PLUGIN_RUNTIME_DIR/`
        decky_plugin.migrate_runtime(
            os.path.join(decky_plugin.DECKY_HOME, "template"),
            os.path.join(
                decky_plugin.DECKY_USER_HOME, ".local", "share", "decky-template"
            ),
        )

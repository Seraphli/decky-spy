import json
import os
import subprocess
import traceback

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code one directory up
# or add the `decky-loader/plugin` path to `python.analysis.extraPaths` in `.vscode/settings.json`
import decky_plugin
from settings import SettingsManager


def run_command(command):
    """Executes a system command and returns the output."""
    try:
        result = subprocess.run(
            command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except Exception as e:
        return None, str(e), -1


class Plugin:
    VERSION = decky_plugin.DECKY_PLUGIN_VERSION
    settingsManager = SettingsManager(
        "decky-spy", os.environ["DECKY_PLUGIN_SETTINGS_DIR"]
    )

    async def get_version(self):
        return {"code": 0, "data": self.VERSION}

    async def cli(self, command, args=""):
        await Plugin.log_py(self, f"cli call: {command} {args}")
        try:
            out = subprocess.check_output(
                f"{os.path.dirname(__file__)}/cli {command} {args}",
                stderr=subprocess.STDOUT,
                shell=True,
            ).decode()
            await Plugin.log_py(self, f"stdout capture: {out}")
            json_out = json.loads(out)
            payload = {"code": 0, "data": json.dumps(json_out["result"])}
            await Plugin.log_py(self, f"return payload: {payload}")
            return payload
        except Exception:
            except_info = traceback.format_exc()
            await Plugin.log_py_err(self, f"exception info: {except_info}")
            payload = {"code": 1, "data": except_info}
            await Plugin.log_py(self, f"return payload: {payload}")
            return payload

    async def get_cpu(self):
        return await Plugin.cli(self, "get-cpu")

    async def get_memory(self):
        return await Plugin.cli(self, "get-memory")

    async def get_top_k_mem_procs(self, k=1):
        return await Plugin.cli(self, "get-top-k-mem-procs", f"--k={k}")

    async def get_boottime(self):
        return await Plugin.cli(self, "get-boottime")

    async def get_battery(self):
        return await Plugin.cli(self, "get-battery")

    async def get_net_interface(self):
        return await Plugin.cli(self, "get-net-interface")

    async def log(self, message):
        value = await Plugin.get_settings(self, "debug.frontend", True, string=False)
        if value:
            decky_plugin.logger.info("[DeckySpy][F]" + message)

    async def log_err(self, message):
        decky_plugin.logger.error("[DeckySpy][F]" + message)

    async def log_py(self, message):
        value = await Plugin.get_settings(self, "debug.backend", True, string=False)
        if value:
            decky_plugin.logger.info("[DeckySpy][B]" + message)

    async def log_py_err(self, message):
        decky_plugin.logger.error("[DeckySpy][B]" + message)

    async def get_settings(self, key, default, string=True):
        value = self.settingsManager.getSetting(key, default)
        if string:
            return {"code": 0, "data": value}
        return value

    async def set_settings(self, key, value):
        self.settingsManager.setSetting(key, value)

    async def commit_settings(self):
        self.settingsManager.commit()

    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        self.settingsManager.read()
        decky_plugin.logger.info(f"=== Load Decky Spy ver{self.VERSION} ===")
        ret = run_command(["chmod", "+x", f"{os.path.dirname(__file__)}/cli"])
        decky_plugin.logger.info(f"CLI chmod: {ret}")

    # Function called first during the unload process, utilize this to handle your plugin being removed
    async def _unload(self):
        decky_plugin.logger.info("=== Unload Decky Spy ===")

    # Migrations that should be performed before entering `_main()`.
    async def _migration(self):
        decky_plugin.logger.info("Migrating")
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

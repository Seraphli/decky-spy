import time
from typing import Dict

import psutil


class DeckySpy:
    @staticmethod
    def get_memory() -> Dict[str, int | float]:
        mem = psutil.virtual_memory()
        return {
            "total": mem.total,
            "available": mem.available,
            "percent": mem.percent,
        }

    @staticmethod
    def get_top_k_mem_procs(
        k=10,
    ) -> list[Dict[str, int | str | Dict[str, int | float]]]:
        procs = {
            p.pid: {
                "pid": p.pid,
                "name": p.info["name"],
                "mem": {
                    "rss": p.info["memory_info"].rss,
                    "vms": p.info["memory_info"].vms,
                },
            }
            for p in psutil.process_iter(["name", "memory_info"])
        }
        top = sorted(procs.values(), key=lambda x: x["mem"]["rss"], reverse=True)[:k]
        return top

    @staticmethod
    def get_uptime() -> str:
        uptime = time.time() - psutil.boot_time()
        # Convert time to a readable format
        uptime_readable = time.strftime("%H:%M:%S", time.gmtime(uptime))
        return uptime_readable

    @staticmethod
    def get_battery() -> Dict[str, int | float]:
        battery = psutil.sensors_battery()
        if battery is None:
            return {
                "battery": False,
                "percent": -1,
                "secsleft": -1,
                "power_plugged": -1,
            }
        return {
            "battery": True,
            "percent": battery.percent,
            "secsleft": battery.secsleft,
            "power_plugged": battery.power_plugged,
        }

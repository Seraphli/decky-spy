import time
from typing import Dict

import psutil


class DeckySpy:
    @staticmethod
    def get_memory():
        vmem = psutil.virtual_memory()
        swap = psutil.swap_memory()
        return {
            "vmem": {
                "total": vmem.total,
                "used": vmem.used,
                "percent": vmem.percent,
            },
            "swap": {
                "total": swap.total,
                "used": swap.used,
                "percent": swap.percent,
            },
        }

    @staticmethod
    def get_top_k_mem_procs(k=10):
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
    def get_uptime() -> float:
        uptime = time.time() - psutil.boot_time()
        return uptime

    @staticmethod
    def get_battery() -> Dict[str, int | float]:
        battery = psutil.sensors_battery()
        if battery is None:
            return {
                "battery": False,
                "percent": -1,
                "secsleft": -1,
                "plugged": True,
            }
        return {
            "battery": True,
            "percent": battery.percent,
            "secsleft": battery.secsleft,
            "plugged": battery.power_plugged,
        }

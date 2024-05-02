import datetime
import socket
import subprocess
import time
from typing import Dict

import psutil

af_map = {
    socket.AF_INET: "IPv4",
    socket.AF_INET6: "IPv6",
    psutil.AF_LINK: "MAC",
}


class DeckySpy:
    @staticmethod
    def get_cpu():
        cpu = psutil.cpu_percent(interval=1)
        return {"result": cpu, "debug": ""}

    @staticmethod
    def get_memory():
        vmem = psutil.virtual_memory()
        swap = psutil.swap_memory()
        return {
            "result": {
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
            },
            "debug": "",
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
        return {"result": top, "debug": ""}

    @staticmethod
    def get_boottime() -> float:
        return {"result": psutil.boot_time(), "debug": ""}

    @staticmethod
    def get_battery() -> Dict[str, int | float]:
        battery = psutil.sensors_battery()
        if battery is None:
            return {
                "result": {
                    "battery": False,
                    "percent": -1,
                    "secsleft": -1,
                    "plugged": True,
                },
                "debug": "",
            }
        return {
            "result": {
                "battery": True,
                "percent": battery.percent,
                "secsleft": battery.secsleft,
                "plugged": battery.power_plugged,
            },
            "debug": "",
        }

    @staticmethod
    def get_net_interface():
        interfaces_info = []
        for nic, addrs in psutil.net_if_addrs().items():
            interface_info = {"name": nic, "addresses": []}
            for addr in addrs:
                interface_info["addresses"].append(
                    {
                        "family": af_map.get(addr.family, addr.family),
                        "address": addr.address,
                        "netmask": addr.netmask if addr.netmask else "",
                        "broadcast": addr.broadcast if addr.broadcast else "",
                        "p2p": addr.ptp if addr.ptp else "",
                    }
                )
            interfaces_info.append(interface_info)
        return {"result": interfaces_info, "debug": ""}

import datetime
import socket
import subprocess
import time
from typing import Dict

import psutil
from dateutil import parser

af_map = {
    socket.AF_INET: "IPv4",
    socket.AF_INET6: "IPv6",
    psutil.AF_LINK: "MAC",
}


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
    def get_uptime_since_powerup() -> float:
        # Retrieve the last 1000 logs from systemd-logind
        cmd = "journalctl -b -u systemd-logind -n 1000"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        log = result.stdout

        current_time = datetime.datetime.now()
        current_year = current_time.year
        previous_year = current_year - 1

        # Look for the last boot or wake event
        for line in reversed(log.splitlines()):
            if (
                "Operation 'sleep' finished" in line
                or "Starting User Login Management" in line
            ):
                try:
                    # Extract and parse the date and time
                    date_time_str = " ".join(line.split()[:3])
                    event_time = parser.parse(date_time_str, fuzzy=True)

                    # Adjust the year if necessary
                    if event_time.month == 12 and current_time.month == 1:
                        event_time = event_time.replace(year=previous_year)

                    uptime = current_time - event_time
                    return uptime.total_seconds()
                except ValueError:
                    continue

        return 0

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
        return interfaces_info

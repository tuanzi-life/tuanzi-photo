#!/usr/bin/env python3

import json
import sys

try:
    import smbus
except ImportError:
    import smbus2 as smbus

    sys.modules["smbus"] = smbus

from INA219 import INA219


def clamp(value, minimum, maximum):
    return max(minimum, min(maximum, value))


def main():
    ina219 = INA219(addr=0x43)

    bus_voltage = ina219.getBusVoltage_V()
    shunt_voltage_mV = ina219.getShuntVoltage_mV()
    current_mA = ina219.getCurrent_mA()
    power_W = ina219.getPower_W()

    percent = clamp((bus_voltage - 3.0) / 1.2 * 100, 0.0, 100.0)

    payload = {
        "percent": round(percent, 1),
        "voltage": round(bus_voltage, 3),
        "current_mA": round(current_mA, 1),
        "power_W": round(power_W, 3),
    }

    if shunt_voltage_mV is None:
        raise RuntimeError("failed to read shunt voltage")

    sys.stdout.write(json.dumps(payload, separators=(",", ":")) + "\n")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        sys.stderr.write(f"{error}\n")
        sys.exit(1)

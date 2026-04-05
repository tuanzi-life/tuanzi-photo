#!/usr/bin/env python3

import json
import statistics
import sys
import time

try:
    import smbus
except ImportError:
    import smbus2 as smbus

    sys.modules["smbus"] = smbus

from INA219 import INA219

SAMPLE_COUNT = 5
SAMPLE_INTERVAL_SECONDS = 0.05
CURRENT_IDLE_THRESHOLD_MA = 20.0
FULL_VOLTAGE_THRESHOLD_V = 4.15
BATTERY_SOC_CURVE = [
    (3.0, 0),
    (3.3, 2),
    (3.5, 5),
    (3.6, 10),
    (3.68, 20),
    (3.74, 30),
    (3.77, 40),
    (3.79, 50),
    (3.82, 60),
    (3.87, 70),
    (3.92, 80),
    (4.0, 90),
    (4.08, 95),
    (4.15, 100),
]

# 微雪这块 UPS 板上，通常负电流表示电池正在被充电。
# 如果实测方向相反，只需要翻转这个开关。
NEGATIVE_CURRENT_MEANS_CHARGING = True


def clamp(value, minimum, maximum):
    return max(minimum, min(maximum, value))


def median_sample(reader, sample_count=SAMPLE_COUNT, interval_seconds=SAMPLE_INTERVAL_SECONDS):
    values = []
    for index in range(sample_count):
        values.append(reader())
        if index != sample_count - 1:
            time.sleep(interval_seconds)
    return statistics.median(values)


def infer_status(voltage, current_mA):
    if current_mA <= -CURRENT_IDLE_THRESHOLD_MA:
        return "charging" if NEGATIVE_CURRENT_MEANS_CHARGING else "discharging"

    if current_mA >= CURRENT_IDLE_THRESHOLD_MA:
        return "discharging" if NEGATIVE_CURRENT_MEANS_CHARGING else "charging"

    if voltage >= FULL_VOLTAGE_THRESHOLD_V:
        return "full"

    return "idle"


def estimate_percent(voltage):
    if voltage <= BATTERY_SOC_CURVE[0][0]:
        return BATTERY_SOC_CURVE[0][1]

    if voltage >= BATTERY_SOC_CURVE[-1][0]:
        return BATTERY_SOC_CURVE[-1][1]

    for (low_voltage, low_percent), (high_voltage, high_percent) in zip(
        BATTERY_SOC_CURVE, BATTERY_SOC_CURVE[1:]
    ):
        if low_voltage <= voltage <= high_voltage:
            span = high_voltage - low_voltage
            if span == 0:
                return high_percent

            ratio = (voltage - low_voltage) / span
            return low_percent + ratio * (high_percent - low_percent)

    return 0


def main():
    ina219 = INA219(addr=0x43)

    bus_voltage = median_sample(ina219.getBusVoltage_V)
    shunt_voltage_mV = median_sample(ina219.getShuntVoltage_mV)
    current_mA = median_sample(ina219.getCurrent_mA)
    power_W = median_sample(ina219.getPower_W)
    battery_voltage = bus_voltage + (shunt_voltage_mV / 1000.0)

    percent = clamp(round(estimate_percent(battery_voltage)), 0, 100)
    status = infer_status(bus_voltage, current_mA)

    payload = {
        "percent": int(percent),
        "voltage": round(bus_voltage, 3),
        "current_mA": round(current_mA, 1),
        "power_W": round(power_W, 3),
        "status": status,
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

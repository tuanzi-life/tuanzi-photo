from setuptools import setup

setup(
    name="waveshare-ups",
    description="Waveshare UPS driver wrapper",
    py_modules=["INA219"],
    install_requires=["smbus2"],
)

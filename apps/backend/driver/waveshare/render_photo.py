#!/usr/bin/env python3

import logging
import os
import sys

from PIL import Image


BASE_DIR = os.path.dirname(os.path.realpath(__file__))
LIB_DIR = os.path.join(BASE_DIR, "lib")

if os.path.exists(LIB_DIR):
    sys.path.append(LIB_DIR)

from waveshare_epd import epd7in3e  # noqa: E402


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def main() -> int:
    if len(sys.argv) != 2:
        logger.error("usage: render_photo.py <image_path>")
        return 1

    image_path = os.path.abspath(sys.argv[1])
    if not os.path.exists(image_path):
        logger.error("image file not found: %s", image_path)
        return 1

    epd = epd7in3e.EPD()
    initialized = False

    try:
        logger.info("initializing e-paper display")
        if epd.init() != 0:
            logger.error("failed to initialize e-paper display")
            return 1

        initialized = True
        logger.info("loading image: %s", image_path)
        image = Image.open(image_path)

        logger.info("rendering image to e-paper display")
        epd.display(epd.getbuffer(image))

        logger.info("entering sleep mode")
        epd.sleep()
        initialized = False
        return 0
    except KeyboardInterrupt:
        logger.error("render interrupted by keyboard signal")
        return 130
    except Exception:
        logger.exception("failed to render photo")
        return 1
    finally:
        if initialized:
            try:
                epd7in3e.epdconfig.module_exit(cleanup=True)
            except Exception:
                logger.exception("failed to cleanup e-paper module")


if __name__ == "__main__":
    raise SystemExit(main())

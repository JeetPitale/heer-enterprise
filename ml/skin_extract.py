import cv2
import numpy as np

def extract_skin(face):
    ycrcb = cv2.cvtColor(face, cv2.COLOR_BGR2YCrCb)

    # Wider range to capture more skin tones
    lower = np.array([0, 125, 70])
    upper = np.array([255, 180, 135])

    mask = cv2.inRange(ycrcb, lower, upper)

    # If too few skin pixels found, try an even wider range
    if cv2.countNonZero(mask) < 100:
        lower2 = np.array([0, 120, 60])
        upper2 = np.array([255, 190, 145])
        mask = cv2.inRange(ycrcb, lower2, upper2)

    skin = cv2.bitwise_and(face, face, mask=mask)

    return skin, mask

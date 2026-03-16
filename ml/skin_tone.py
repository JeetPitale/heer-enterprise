import cv2
import numpy as np

def get_skin_tone_and_undertone(skin, mask):
    pixels = skin[mask > 0]

    if len(pixels) < 100:
        return "Unknown", "Unknown"

    # ---- Use LAB color space for more accurate analysis ----
    # LAB separates lightness from color, making it ideal for skin analysis
    lab = cv2.cvtColor(
        pixels.reshape(-1, 1, 3), cv2.COLOR_BGR2LAB
    )

    L = np.median(lab[:, :, 0])   # Lightness (0-255 in OpenCV, maps to 0-100)
    a = np.median(lab[:, :, 1])   # Green-Red axis (128 = neutral)
    b = np.median(lab[:, :, 2])   # Blue-Yellow axis (128 = neutral)

    # Also compute in HSV for hue-based analysis
    hsv = cv2.cvtColor(
        pixels.reshape(-1, 1, 3), cv2.COLOR_BGR2HSV
    )
    H = np.median(hsv[:, :, 0])   # Hue (0-180)
    S = np.median(hsv[:, :, 1])   # Saturation (0-255)
    V = np.median(hsv[:, :, 2])   # Value/Brightness (0-255)

    # Get mean BGR for additional analysis
    mean_b = np.median(pixels[:, 0])
    mean_g = np.median(pixels[:, 1])
    mean_r = np.median(pixels[:, 2])

    # ITA (Individual Typology Angle) — gold standard for skin classification
    # ITA = arctan((L - 50) / b) * (180/pi)
    L_scaled = L * 100.0 / 255.0  # Convert OpenCV L to 0-100
    b_scaled = (b - 128.0)  # Center b around 0
    if abs(b_scaled) < 0.01:
        b_scaled = 0.01

    ita = np.degrees(np.arctan2(L_scaled - 50, b_scaled))

    print(f"LAB: L={L:.1f}, a={a:.1f}, b={b:.1f}")
    print(f"HSV: H={H:.1f}, S={S:.1f}, V={V:.1f}")
    print(f"BGR: B={mean_b:.1f}, G={mean_g:.1f}, R={mean_r:.1f}")
    print(f"ITA: {ita:.1f}")

    # ---- SKIN TONE using ITA (Individual Typology Angle) ----
    # ITA-based classification is the dermatological standard
    if ita > 55:
        tone = "Very Fair"
    elif ita > 41:
        tone = "Fair"
    elif ita > 28:
        tone = "Medium"
    elif ita > 10:
        tone = "Olive"
    elif ita > -30:
        tone = "Dark"
    else:
        tone = "Very Dark"

    # ---- UNDERTONE using LAB a/b + Hue ----
    # a > 128 = red-ish (warm), a < 128 = green-ish
    # b > 128 = yellow-ish (warm), b < 128 = blue-ish (cool)
    a_centered = a - 128.0  # positive = red, negative = green
    b_centered = b - 128.0  # positive = yellow, negative = blue

    # Warm: high redness + high yellowness
    # Cool: low redness + low yellowness / blue-ish
    # Hue: 0-15 = very warm/red, 15-25 = warm/orange, 25+ = cooler
    warm_score = 0

    # Yellow component (b channel)
    if b_centered > 12:
        warm_score += 2
    elif b_centered > 5:
        warm_score += 1
    elif b_centered < -2:
        warm_score -= 1

    # Red component (a channel)
    if a_centered > 8:
        warm_score += 1
    elif a_centered < 2:
        warm_score -= 1

    # Hue-based (skin hue < 18 = warm, > 22 = cooler)
    if H < 15:
        warm_score += 1
    elif H > 22:
        warm_score -= 1

    # R-G ratio (warm skin has more red relative to green)
    if mean_r > 0:
        rg_ratio = mean_r / max(mean_g, 1)
        if rg_ratio > 1.25:
            warm_score += 1
        elif rg_ratio < 1.05:
            warm_score -= 1

    print(f"Warm score: {warm_score}")

    if warm_score >= 3:
        undertone = "Warm"
    elif warm_score <= 0:
        undertone = "Cool"
    else:
        undertone = "Neutral"

    print(f"Result: {tone} / {undertone}")
    return tone, undertone

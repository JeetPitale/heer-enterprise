import cv2

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

alt_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml"
)

def get_face(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # Enhance contrast for better detection
    gray = cv2.equalizeHist(gray)

    # Try primary cascade with relaxed params
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))

    # Fallback to alt cascade if primary fails
    if len(faces) == 0:
        faces = alt_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(30, 30))

    if len(faces) == 0:
        return None, "NO_FACE"

    # Pick the largest face
    faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)

    h, w, _ = image.shape
    x, y, fw, fh = faces[0]

    face_area = fw * fh
    image_area = h * w

    print(f"Face detected: {fw}x{fh} at ({x},{y}), ratio: {face_area/image_area:.3f}")

    # Reject full-body images (very small face relative to image)
    if face_area / image_area < 0.03:
        return None, "FULL_BODY"

    # Add padding around face for better skin sampling
    pad = int(min(fw, fh) * 0.15)
    x1 = max(0, x - pad)
    y1 = max(0, y - pad)
    x2 = min(w, x + fw + pad)
    y2 = min(h, y + fh + pad)

    face = image[y1:y2, x1:x2]
    return face, "OK"

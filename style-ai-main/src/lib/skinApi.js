import API from "./api";

// Helper function to compress large images before sending them to the backend
const compressImage = (file, maxDimension = 800) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas to Blob failed"));
              return;
            }
            const compressedFile = new File([blob], file.name || "image.jpg", {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          0.8
        );
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
};

export const analyzeSkinApi = async (imageFile) => {
  let fileToSend = imageFile;
  
  try {
    // Attempt client-side compression to prevent 502/OOM errors on the backend
    fileToSend = await compressImage(imageFile, 800);
  } catch (err) {
    console.warn("Client-side image compression failed. Sending original.", err);
  }

  const formData = new FormData();
  formData.append("image", fileToSend);

  const res = await API.post("/skin/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

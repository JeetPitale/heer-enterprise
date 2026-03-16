import axios from "axios";
import FormData from "form-data";

export const analyzeSkin = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "No image received" });
    }

    const formData = new FormData();
    formData.append("image", req.file.buffer, {
      filename: "image.jpg",
      contentType: req.file.mimetype,
    });

    console.log("Analyzing skin via Python service...");
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:5002/analyze";

    const response = await axios.post(
      pythonServiceUrl,
      formData,
      { headers: formData.getHeaders() }
    );
    console.log("Python response:", response.data);

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      console.error("NODE → PYTHON ERROR:", error.response.status, error.response.data);
      return res.status(error.response.status).json(error.response.data);
    }
    console.error("NODE → PYTHON ERROR:", error.message);
    res.status(500).json({ message: "Skin analysis failed" });
  }
};

import Nurse from "../models/nurseModel.js";

export const getNurseProfile = async (req, res) => {
  try {
    const nurse = await Nurse.findById(req.nurse.id).select("-password");
    if (!nurse) {
      return res.status(404).json({ success: false, message: "Nurse not found" });
    }
    res.status(200).json({ success: true, nurse });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

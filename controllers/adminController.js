import nodemailer from "nodemailer";
import PendingStaff from "../models/PendingStaff.js";
import Nurse from "../models/Nurse.js";
import Doctor from "../models/Doctor.js";
import AcceptedStaff from "../models/AcceptedStaff.js";
import RejectedStaff from "../models/RejectedStaff.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "satwikapoluri@gmail.com",
    pass: "qlvb txvy kbaw yphh", // Use App Password
  },
});

export const getPendingStaff = async (req, res) => {
  try {
    const staff = await PendingStaff.find();
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Error fetching pending staff" });
  }
};

export const getAcceptedStaff = async (req, res) => {
  try {
    const staff = await AcceptedStaff.find();
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Error fetching accepted staff" });
  }
};

export const getRejectedStaff = async (req, res) => {
  try {
    const staff = await RejectedStaff.find();
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Error fetching rejected staff" });
  }
};

export const getAllNurses = async (req, res) => {
  try {
    const nurses = await Nurse.find();
    res.json(nurses);
  } catch (err) {
    res.status(500).json({ message: "Error fetching nurses" });
  }
};
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.status(200).json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const approveStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await PendingStaff.findById(id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    // Move to respective collection
    if (staff.role === "nurse") {
      await Nurse.create(staff.toObject());
    } else if (staff.role === "doctor") {
      await Doctor.create(staff.toObject());
    }

    await AcceptedStaff.create(staff.toObject());
    await PendingStaff.findByIdAndDelete(id);

    await transporter.sendMail({
      from: "satwikapoluri@gmail.com",
      to: staff.email,
      subject: "Application Approved",
      text: `Dear ${staff.fullName}, your application as ${staff.role} has been approved. Welcome aboard!`,
    });

    res.json({ message: "Staff approved, moved to respective table, and notified by email." });
  } catch (err) {
    res.status(500).json({ message: "Error approving staff" });
  }
};

export const rejectStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await PendingStaff.findById(id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    await RejectedStaff.create(staff.toObject());
    await PendingStaff.findByIdAndDelete(id);

    await transporter.sendMail({
      from: "satwikapoluri@gmail.com",
      to: staff.email,
      subject: "Application Rejected",
      text: `Dear ${staff.fullName}, we regret to inform you that your application for ${staff.role} has been rejected.`,
    });

    res.json({ message: "Staff rejected and notified by email." });
  } catch (err) {
    res.status(500).json({ message: "Error rejecting staff" });
  }
};

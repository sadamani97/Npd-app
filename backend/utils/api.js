export const addComplaint = async (req, res) => {
  const complaint = await Complaint.create(req.body);
  res.json(complaint);
};
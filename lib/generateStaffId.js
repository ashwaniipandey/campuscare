import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

/**
 * Generates the next sequential staff ID in the format "DOC-0001", "DOC-0002", etc.
 * Safely finds the maximum numeric suffix among existing staff members.
 */
export async function generateNextStaffId() {
  await dbConnect();

  const staffUsers = await User.find({ staffId: { $regex: /^DOC-\d+$/ } })
    .select("staffId")
    .lean();

  let maxNum = 0;
  for (const u of staffUsers) {
    const match = u.staffId?.match(/^DOC-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  return `DOC-${String(nextNum).padStart(4, "0")}`;
}

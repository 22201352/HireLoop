import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendStatusUpdateEmail({ to, candidateName, jobTitle, companyName, newStatus }) {
  const subject = `Update on your application for ${jobTitle}`;
  const historyLink = `${process.env.APP_URL}/candidate/history`;

  const html = `
    <p>Hi ${candidateName},</p>
    <p>Your status has been updated.</p>
    <p>Job: <strong>${jobTitle}</strong></p>
    <p>Company: <strong>${companyName}</strong></p>
    <p>Please <a href="${historyLink}">click here</a> to check your new status.</p>
    <p>Thank you for using HireLoop.</p>
  `;

  await transporter.sendMail({
    from: `"HireLoop" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
export async function sendInterviewProposedEmail({ to, candidateName, jobTitle, companyName, proposedSlots }) {
  const subject = `Interview invitation for ${jobTitle}`;
  const historyLink = `${process.env.APP_URL}/candidate/dashboard`;

  const slotsHtml = proposedSlots
    .map((slot) => `<li>${new Date(slot).toLocaleString()}</li>`)
    .join('');

  const html = `
    <p>Hi ${candidateName},</p>
    <p>You've been invited for an interview.</p>
    <p>Job: <strong>${jobTitle}</strong></p>
    <p>Company: <strong>${companyName}</strong></p>
    <p>Proposed times:</p>
    <ul>${slotsHtml}</ul>
    <p>Please <a href="${historyLink}">click here</a> to pick a time that works for you.</p>
    <p>Thank you for using HireLoop.</p>
  `;

  await transporter.sendMail({
    from: `"HireLoop" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

export async function sendInterviewConfirmedEmail({ to, candidateName, jobTitle, confirmedSlot }) {
  const subject = `Interview confirmed: ${jobTitle}`;

  const html = `
    <p>Hi,</p>
    <p><strong>${candidateName}</strong> has confirmed an interview time.</p>
    <p>Job: <strong>${jobTitle}</strong></p>
    <p>Confirmed time: <strong>${new Date(confirmedSlot).toLocaleString()}</strong></p>
    <p>Thank you for using HireLoop.</p>
  `;

  await transporter.sendMail({
    from: `"HireLoop" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

export async function sendRecruiterApprovalEmail({ to, recruiterName, action, note }) {
  const approved = action === "approve";
  const decision = approved ? "approved" : "rejected";
  const subject = `HireLoop recruiter account ${decision}`;
  const loginLink = `${process.env.APP_URL}/login`;
  const noteHtml = note ? `<p><strong>Note from the admin:</strong> ${note}</p>` : "";

  const html = `
    <p>Hi ${recruiterName},</p>
    <p>Your HireLoop recruiter account has been <strong>${decision}</strong>.</p>
    ${noteHtml}
    ${approved
      ? `<p>You can now <a href="${loginLink}">sign in to HireLoop</a> and manage your job listings.</p>`
      : "<p>Your recruiter account will not be able to access the recruiter dashboard.</p>"}
    <p>Thank you for using HireLoop.</p>
  `;

  await transporter.sendMail({
    from: `"HireLoop" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
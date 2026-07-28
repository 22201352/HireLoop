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
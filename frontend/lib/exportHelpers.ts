import { InterfaceRequest } from "@/types";
import { formatDate, formatDateTime, formatFileSize, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/utils";

export async function exportIRRegisterToExcel(irs: InterfaceRequest[]) {
  const { utils, writeFile } = await import("xlsx");

  const totals = {
    total: irs.length,
    critical: irs.filter((ir) => ir.priority === "critical").length,
    nonCritical: irs.filter((ir) => ir.priority === "non_critical").length,
  };

  const statusCounts = irs.reduce<Record<string, number>>((acc, ir) => {
    acc[ir.status] = (acc[ir.status] ?? 0) + 1;
    return acc;
  }, {});

  const summaryRows: Array<Array<string | number>> = [
    ["IR Register Report"],
    [],
    ["Generated At", formatDateTime(new Date().toISOString())],
    ["Total Requests", totals.total],
    ["Critical", totals.critical],
    ["Non-Critical", totals.nonCritical],
    [],
    ["Status", "Count"],
    ...Object.entries(statusCounts).map(([status, count]) => [STATUS_LABELS[status as keyof typeof STATUS_LABELS], count]),
    [],
  ];

  const rows = irs.map((ir) => ({
    "IR Number": ir.irNumber,
    Title: ir.title,
    Requestor: ir.requestorCompany?.name ?? "",
    Responder: ir.responderCompany?.name ?? "",
    Priority: PRIORITY_LABELS[ir.priority],
    Status: STATUS_LABELS[ir.status],
    "Due Date": formatDate(ir.dueDate),
    "Last Updated": formatDateTime(ir.updatedAt),
  }));

  const headerRow = [
    "IR Number",
    "Title",
    "Requestor",
    "Responder",
    "Priority",
    "Status",
    "Due Date",
    "Last Updated",
  ];

  const worksheet = utils.aoa_to_sheet([...summaryRows, headerRow]);
  utils.sheet_add_json(worksheet, rows, { origin: `A${summaryRows.length + 2}`, skipHeader: true });

  worksheet["!cols"] = [
    { wch: 16 },
    { wch: 40 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
  ];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "IR Register");

  const filename = `IR_Register_${new Date().toISOString().slice(0, 10)}.xlsx`;
  writeFile(workbook, filename);
}

export async function downloadIRSummaryPdf(ir: InterfaceRequest) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (height: number) => {
    if (y + height > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("IR Summary Report", margin, y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${formatDateTime(new Date().toISOString())}`, margin, y + 18);
  doc.text(`Report for: ${ir.project?.name ?? "N/A"}`, pageWidth - margin, y + 18, { align: "right" });
  y += 34;

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  const infoPairs = [
    ["IR Number", ir.irNumber],
    ["Title", ir.title],
    ["Priority", PRIORITY_LABELS[ir.priority]],
    ["Status", STATUS_LABELS[ir.status]],
    ["Project", ir.project?.name ?? "N/A"],
    ["Requestor", ir.requestorCompany?.name ?? "N/A"],
    ["Responder", ir.responderCompany?.name ?? "N/A"],
    ["Due Date", formatDate(ir.dueDate)],
    ["Last Updated", formatDateTime(ir.updatedAt)],
    ["Assigned To", ir.assignedUserId ?? "Unassigned"],
  ];

  doc.setFontSize(11);
  infoPairs.forEach(([label, value]) => {
    ensureSpace(18);
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), margin + 110, y, { maxWidth: maxWidth - 120 });
    y += 18;
  });

  y += 6;
  ensureSpace(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Description", margin, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const descriptionLines = doc.splitTextToSize(ir.description || "No description provided.", maxWidth);
  ensureSpace(descriptionLines.length * 14);
  doc.text(descriptionLines, margin, y);
  y += descriptionLines.length * 14 + 12;

  if (ir.response) {
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Response Summary", margin, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const responseLines = doc.splitTextToSize(ir.response.content || "No response content.", maxWidth);
    ensureSpace(responseLines.length * 14);
    doc.text(responseLines, margin, y);
    y += responseLines.length * 14 + 10;
    doc.text(`Submitted at: ${formatDateTime(ir.response.submittedAt)}`, margin, y);
    y += 20;
  }

  ensureSpace(18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Attachments", margin, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  if (ir.attachments?.length > 0) {
    ir.attachments.forEach((attachment) => {
      ensureSpace(16);
      const attachmentText = `${attachment.filename} (${formatFileSize(attachment.size)})`;
      const lines = doc.splitTextToSize(attachmentText, maxWidth - 20);
      doc.text(lines, margin + 10, y);
      y += lines.length * 14;
    });
  } else {
    ensureSpace(14);
    doc.text("No attachments available.", margin + 10, y);
    y += 14;
  }

  ensureSpace(22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Workflow History", margin, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const historyItems = ir.workflowLogs ?? [];
  if (historyItems.length > 0) {
    historyItems.forEach((log) => {
      const actionLine = `${formatDateTime(log.timestamp)} — ${log.action} by ${log.actorName}`;
      const lines = doc.splitTextToSize(actionLine, maxWidth);
      ensureSpace(lines.length * 14);
      doc.text(lines, margin, y);
      y += lines.length * 14;
      if (log.comment) {
        const commentLines = doc.splitTextToSize(`Comment: ${log.comment}`, maxWidth - 20);
        ensureSpace(commentLines.length * 12);
        doc.text(commentLines, margin + 10, y);
        y += commentLines.length * 12;
      }
      y += 8;
    });
  } else {
    ensureSpace(14);
    doc.text("No workflow history recorded.", margin, y);
    y += 14;
  }

  const safeFilename = ir.irNumber.replace(/[^a-zA-Z0-9-_]/g, "_");
  doc.save(`IR_Summary_${safeFilename}.pdf`);
}

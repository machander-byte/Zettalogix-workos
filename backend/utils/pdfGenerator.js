import PDFDocument from 'pdfkit';

export const generateLogReport = ({ title, logs }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(22).text(title, { align: 'center' }).moveDown();
    logs.forEach((log) => {
      doc
        .fontSize(14)
        .text(`Employee: ${log.user?.name || 'Unknown'} (${log.user?.email || 'N/A'})`);
      doc
        .fontSize(12)
        .text(`Date: ${new Date(log.createdAt).toLocaleString()}`)
        .moveDown(0.5);
      doc.font('Helvetica-Bold').text('Accomplishments');
      doc.font('Helvetica').text(log.whatDone || 'N/A').moveDown(0.5);
      doc.font('Helvetica-Bold').text('Problems');
      doc.font('Helvetica').text(log.problems || 'N/A').moveDown(0.5);
      doc.font('Helvetica-Bold').text('Tomorrow');
      doc.font('Helvetica').text(log.tomorrowPlan || 'N/A').moveDown(0.5);
      doc.font('Helvetica-Bold').text('Time Spent');
      log.timeSpentPerTask?.forEach((entry) => {
        doc
          .font('Helvetica')
          .text(`• ${entry.taskTitle || entry.task}: ${entry.minutes || 0} minutes`);
      });
      doc.moveDown();
      doc.moveDown();
    });

    doc.end();
  });

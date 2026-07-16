const fmcsaService = require('../services/fmcsaService');
const pdfService = require('../services/pdfService');
const emailService = require('../services/emailService');

async function generateReport(req, res, next) {
  try {
    const { dotNumber, mcNumber } = req.query;
    if (!dotNumber && !mcNumber) {
      const err = new Error('DOT or MC number required');
      err.statusCode = 400;
      throw err;
    }
    const carrier = await fmcsaService.searchCarrier({ dotNumber, mcNumber });
    res.json({ success: true, data: carrier });
  } catch (err) { next(err); }
}

async function downloadPdf(req, res, next) {
  try {
    const { dotNumber, mcNumber } = req.query;
    if (!dotNumber && !mcNumber) {
      const err = new Error('DOT or MC number required');
      err.statusCode = 400;
      throw err;
    }
    const carrier = await fmcsaService.searchCarrier({ dotNumber, mcNumber });
    const pdf = await pdfService.generateCarrierReport(carrier);
    const filename = `carrier_report_${carrier.dotNumber || carrier.mcNumber}.pdf`.replace(/[^a-zA-Z0-9_.]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
  } catch (err) { next(err); }
}

async function emailReport(req, res, next) {
  try {
    const { email, dotNumber, mcNumber } = req.body;
    if (!email || (!dotNumber && !mcNumber)) {
      const err = new Error('Email and DOT or MC number required');
      err.statusCode = 400;
      throw err;
    }
    const result = await emailService.sendCarrierReport(email, dotNumber, mcNumber);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

module.exports = { generateReport, downloadPdf, emailReport };

const fmcsaService = require('../services/fmcsaService');
const supabaseService = require('../services/supabaseService');

async function searchCarrier(req, res, next) {
  try {
    const { mcNumber, dotNumber, filters } = req.body;

    if (!mcNumber && !dotNumber) {
      const error = new Error('MC Number or DOT Number is required');
      error.statusCode = 400;
      throw error;
    }

    const cleanMc = mcNumber ? mcNumber.trim().replace(/^MC-?/i, '') : null;
    const cleanDot = dotNumber ? dotNumber.trim().replace(/^DOT-?/i, '') : null;

    const carrier = await fmcsaService.searchCarrier({
      mcNumber: cleanMc,
      dotNumber: cleanDot,
    });

    if (filters) {
      if (filters.authorityStatus && carrier.authorityStatus !== filters.authorityStatus) {
        return res.status(404).json({
          success: false,
          error: 'No carrier matching the specified filters',
        });
      }
      if (filters.safetyRating && carrier.safetyRating !== filters.safetyRating) {
        return res.status(404).json({
          success: false,
          error: 'No carrier matching the specified safety rating',
        });
      }
      if (filters.hazmatCertified && !carrier.hazmatStatus) {
        return res.status(404).json({
          success: false,
          error: 'No hazmat-certified carrier found matching your search',
        });
      }
    }

    if (req.userId) {
      console.log(`[Search] Saving carrier check for userId=${req.userId}`);
      await supabaseService.saveCarrierCheck(req.userId, carrier);
    } else {
      console.warn('[Search] No userId — carrier check NOT saved (auth issue)');
    }

    res.json({
      success: true,
      data: carrier,
    });
  } catch (err) {
    next(err);
  }
}

async function getCarrierById(req, res, next) {
  try {
    const { id } = req.params;
    const { type } = req.query;

    if (!id) {
      const error = new Error('Carrier ID is required');
      error.statusCode = 400;
      throw error;
    }

    const cleanId = id.replace(/^(MC|DOT)-?/i, '').trim();
    if (!cleanId) {
      const error = new Error('Invalid carrier ID format');
      error.statusCode = 400;
      throw error;
    }

    const isDotPrefix = id.toUpperCase().startsWith('DOT');
    const isMcPrefix = id.toUpperCase().startsWith('MC');
    const isNumericOnly = /^\d+$/.test(cleanId);

    let carrier;

    if (type === 'dot' || isDotPrefix) {
      carrier = await fmcsaService.searchCarrier({ dotNumber: cleanId });
    } else if (type === 'mc' || isMcPrefix) {
      carrier = await fmcsaService.searchCarrier({ mcNumber: cleanId });
    } else if (isNumericOnly) {
      // Plain numeric IDs come from dashboard/history links that use DOT numbers.
      // Try DOT first, then fall back to MC.
      try {
        carrier = await fmcsaService.searchCarrier({ dotNumber: cleanId });
      } catch (dotErr) {
        carrier = await fmcsaService.searchCarrier({ mcNumber: cleanId });
      }
    } else {
      carrier = await fmcsaService.searchCarrier({ mcNumber: cleanId });
    }

    res.json({
      success: true,
      data: carrier,
    });
  } catch (err) {
    next(err);
  }
}

async function getSearchHistory(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const history = await supabaseService.getSearchHistory(req.userId, limit);

    res.json({
      success: true,
      data: history,
    });
  } catch (err) {
    next(err);
  }
}

async function clearSearchHistory(req, res, next) {
  try {
    await supabaseService.clearSearchHistory(req.userId);
    res.json({
      success: true,
      data: { message: 'Search history cleared' },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { searchCarrier, getCarrierById, getSearchHistory, clearSearchHistory };

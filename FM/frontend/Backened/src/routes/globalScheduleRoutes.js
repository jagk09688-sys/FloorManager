'use strict';

/**
 * Global Schedule routes — mounted at /api/schedule
 *
 * GET /api/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD&shop=X&rep=X
 *   Returns all schedule entries in the date range with job + customer info
 */

const express = require('express');
const router  = express.Router();
const prisma  = require('../utils/prisma');

router.get('/', async (req, res) => {
  try {
    const { from, to, shop, rep } = req.query;

    const where = {};

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to)   where.date.lte = new Date(new Date(to).setHours(23, 59, 59, 999));
    }

    if (rep) where.representative = { contains: rep, mode: 'insensitive' };

    // Shop filter goes on the job
    if (shop) where.job = { shop };

    const entries = await prisma.scheduleEntry.findMany({
      where,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      include: {
        job: {
          select: {
            id: true,
            title: true,
            shop: true,
            status: true,
            jobRef: true,
            siteStreet: true,
            siteTown: true,
            siteState: true,
            contactName: true,
            contactPhone: true,
            customer: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const oadoi = require('../../../../lib/data/oadoi');

module.exports = function (req, res) {
  const doi = req.query.doi;

  oadoi(doi, function (err, body) {
    if (err) {
      return res.json({ success: false, error: err });
    }

    res.json({ success: true, doi: doi, data: body });
  });
};
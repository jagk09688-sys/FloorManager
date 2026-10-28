"""
backend/src/utils/generate_quote.py

Called by quoteRoute.js via python-shell.
Receives one JSON argument: the job data dict.
Writes a PDF to job_data['output_path'].

Install:  pip install reportlab
"""

import sys
import json
import textwrap
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as rl_canvas

# ── Logo path — update this to wherever you store the logo on your server ──
import os
LOGO = os.path.join(os.path.dirname(__file__), "logo.png")

W, H = A4

ORANGE = colors.HexColor("#E87722")
DARK   = colors.HexColor("#1a1d2e")
GREY   = colors.HexColor("#6b7280")
LGREY  = colors.HexColor("#f3f4f6")
LINE   = colors.HexColor("#e2e5ed")


def hrule(c, y, x1=15, x2=None, color=LINE, lw=0.5):
    x2 = x2 or (W / mm - 15)
    c.setStrokeColor(color)
    c.setLineWidth(lw)
    c.line(x1 * mm, y, x2 * mm, y)


def draw_quote(c, job):
    line_items = job.get("line_items", [])
    quote_options = job.get("quote_options", [])
    gst_rate = float(job.get("gst_rate", 0.10))

    if line_items:
        gross = sum(
            float(li.get("qty", 0)) * float(li.get("unit_sell", 0))
            for li in line_items
            if float(li.get("unit_sell", 0)) > 0
        )
    elif quote_options:
        gross = sum(
            float(li.get("qty", 0)) * float(li.get("unitSell", 0))
            for li in quote_options
            if float(li.get("unitSell", 0)) > 0
        )
    else:
        gross = 0.0

    gst_amt = gross * gst_rate
    total = gross + gst_amt

    left = 15 * mm
    right = W - 15 * mm
    y = H - 16 * mm

    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(left, y, "Quote")
    c.setFont("Helvetica-Bold", 9.5)
    c.drawRightString(right, y, str(job.get("quote_number", "")))

    c.setFont("Helvetica", 8)
    c.setFillColor(GREY)
    c.drawRightString(right, y - 5 * mm, f"Date: {job.get('quote_date', '')}")

    y -= 15 * mm
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(DARK)
    c.drawString(left, y, (job.get("customer_name", "") or "Customer").upper())
    c.setFont("Helvetica", 8.5)
    c.setFillColor(GREY)
    c.drawRightString(right, y, (job.get("site_address", "") or "Site address"))

    y -= 5 * mm
    c.setFont("Helvetica", 8.5)
    c.setFillColor(GREY)
    c.drawString(left, y, job.get("customer_email", ""))
    c.drawRightString(right, y, f"{job.get('site_suburb', '')}  {job.get('site_state', '')}  {job.get('site_country', '')}".strip())

    y -= 12 * mm
    hrule(c, y, color=LINE, lw=0.6)
    y -= 10 * mm

    supply_install = (
        job.get("supply_install") or
        job.get("supplyInstall") or
        " ".join(part for part in [
            job.get("carpet_name") or job.get("carpetName") or "Carpet",
            job.get("underlay_name") or job.get("underlayName") or job.get("underlay") and f"with {job.get('underlay') or job.get('underlayName')}",
        ] if part)
        or "Carpet and underlay"
    )
    rooms = job.get("rooms") or job.get("site_address") or "<Rooms>"

    desc_lines = [
        "TO SUPPLY AND INSTALL:",
        supply_install,
        "",
        "TO:",
        rooms,
        "",
        "THIS QUOTATION INCLUDES:",
        "TAKE UP AND DISPOSAL OF EXISTING CARPET.",
        "BASIC FURNITURE HANDLING.",
        "",
        "THIS QUOTATION DOES NOT INCLUDE:",
        "FURNITURE HANDLING (IF NOT COMPLETED BY CLIENT PRIOR TO INSTALLATION THIS WILL INCUR FURTHER CHARGES)",
        "ANY UNFORESEEN FLOOR PREPARATION WILL BE QUOTED SEPARATE TO THIS QUOTE.",
    ]

    box_h = 78 * mm
    c.setFillColor(colors.white)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.5)
    c.rect(left, y - box_h, W - 30 * mm, box_h, fill=1)

    text_y = y - 6 * mm
    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(DARK)
    for raw_line in desc_lines:
        if not raw_line:
            text_y -= 3 * mm
            continue
        for wrapped in textwrap.wrap(raw_line, width=100):
            c.drawString(left + 4 * mm, text_y, wrapped)
            text_y -= 4.5 * mm
    y -= box_h + 8 * mm

    terms_box_x = left
    terms_box_w = W - 30 * mm
    terms_box_h = 38 * mm
    c.setFillColor(LGREY)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.5)
    c.rect(terms_box_x, y - terms_box_h, terms_box_w, terms_box_h, fill=1)

    terms_y = y - 6 * mm
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(ORANGE)
    c.drawString(left + 4 * mm, terms_y, "PAYMENT TERMS")
    terms_y -= 6 * mm

    c.setFont("Helvetica", 8)
    c.setFillColor(DARK)
    payment_lines = [
        job.get("payment_terms") or
        "Initial deposit 50%, Balance to be paid 3 working day's prior to installation.\nAll orders $1000 or under are to be paid in full upon acceptance of quotation.\nPayment can be made by CASH, CHEQUE or CREDIT CARD.\nAlternatively, payment can be made by ELECTRONIC TRANSFER [please put job name or number as reference].\nBSB 063 237, ACCOUNT NO, 1048 7235",
    ]
    for line in payment_lines:
        for wrapped in textwrap.wrap(line.replace('\n', ' '), width=115):
            c.drawString(left + 4 * mm, terms_y, wrapped)
            terms_y -= 4.5 * mm

    totals_x = W - 58 * mm
    totals_w = 43 * mm
    totals_h = 18 * mm
    c.setFillColor(colors.white)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.5)
    c.rect(totals_x, y - totals_h, totals_w, totals_h, fill=1)

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(ORANGE)
    c.drawRightString(right - 5 * mm, y - 12 * mm, f"TOTAL ${total:,.2f}")

    y -= terms_box_h + 12 * mm

    c.setFont("Helvetica", 8)
    c.setFillColor(GREY)
    c.drawString(left, y, job.get("rep_name", ""))
    y -= 5 * mm
    c.setFont("Helvetica", 7.5)
    c.drawString(left, y, job.get("rep_location", "") or "Flooring Junction")

    if os.path.exists(LOGO):
        logo_w = 28 * mm
        logo_h = 16 * mm
        logo_x = (W - logo_w) / 2
        c.drawImage(LOGO, logo_x, 9 * mm, width=logo_w, height=logo_h, preserveAspectRatio=True, mask='auto')
    else:
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(ORANGE)
        c.drawCentredString(W / 2, 12 * mm, "Flooring Junction")

    c.save()


if __name__ == "__main__":
    raw      = sys.argv[1]
    job_data = json.loads(raw)
    out_path = job_data.get("output_path", "/tmp/quote_output.pdf")

    cv = rl_canvas.Canvas(out_path, pagesize=A4)
    draw_quote(cv, job_data)
    print(f"OK:{out_path}")

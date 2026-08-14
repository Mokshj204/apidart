import type { TestRunResult } from "../types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function toHtmlReport(result: TestRunResult): string {
  const { summary } = result;

  const rows = result.results
    .map((res) => {
      const errorText = res.errors.length > 0 ? escapeHtml(res.errors[0]!.message) : "OK";
      return `
      <tr>
        <td class="${res.passed ? "pass" : "fail"}">${res.passed ? "PASS" : "FAIL"}</td>
        <td>${escapeHtml(res.testCase.id)}</td>
        <td class="num">${res.status}</td>
        <td class="num">${res.responseTime.toFixed(0)}ms</td>
        <td class="error">${errorText}</td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>API Test Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #fafafa; color: #333; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
    .header h1 { margin: 0; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 20px; }
    .stat-box { background: rgba(255,255,255,0.15); padding: 15px; border-radius: 6px; text-align: center; }
    .stat-box .value { font-size: 24px; font-weight: bold; }
    .stat-box .label { font-size: 12px; opacity: 0.9; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e0e0e0; }
    td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
    td.num { text-align: right; }
    td.pass { color: #22c55e; font-weight: 600; }
    td.fail { color: #ef4444; font-weight: 600; }
    td.error { font-size: 12px; color: #666; }
    .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <h1>API Test Report</h1>
    <p>${escapeHtml(result.spec.info.title)} v${escapeHtml(result.spec.info.version)}</p>
    <div class="stats">
      <div class="stat-box"><div class="value">${summary.total}</div><div class="label">Total</div></div>
      <div class="stat-box"><div class="value">${summary.passed}</div><div class="label">Passed</div></div>
      <div class="stat-box"><div class="value">${summary.failed}</div><div class="label">Failed</div></div>
      <div class="stat-box"><div class="value">${summary.avgTime.toFixed(0)}</div><div class="label">Avg Time (ms)</div></div>
    </div>
  </div>
  <table>
    <thead>
      <tr><th></th><th>Endpoint</th><th>Status</th><th>Time</th><th>Error</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Generated at ${result.timestamp} &middot; dapi-test</div>
</body>
</html>`;
}

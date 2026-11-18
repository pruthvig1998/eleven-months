// Paste into the Google Form: three-dot menu > Script editor. Then Triggers > Add trigger > onSubmit, "On form submit".
// Set two Script properties (Project settings > Script properties): WORKER_URL and FORM_SECRET (same value as the Worker's).
// The form needs three questions, in this order: "Type" (multiple choice with the three bucket names), "Your suggestion", "Source".
function onSubmit(e) {
  const p = PropertiesService.getScriptProperties();
  const a = e.response.getItemResponses().map(r => String(r.getResponse()));
  UrlFetchApp.fetch(p.getProperty('WORKER_URL'), {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'X-Form-Secret': p.getProperty('FORM_SECRET') },
    payload: JSON.stringify({ bucket: a[0], text: a[1] || '', source: a[2] || '' }),
  });
}

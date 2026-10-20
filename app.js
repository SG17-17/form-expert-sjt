(() => {
  'use strict';
  const config = JSON.parse(document.getElementById('form-config').textContent);
  const el = id => document.getElementById(id);
  if (!window.Survey?.Model) { el('status').textContent = 'Library form belum dapat dimuat. Pastikan folder vendor berada bersama file form.'; el('start').disabled = true; return; }
  const isSjt = config.slug === 'sjt-soc';
  const original = config.sourceForm;
  const cleanForm = Boolean(original);
  const criteria = {
    relevance: { title: 'Relevansi dengan dimensi', labels: ['Tidak relevan', 'Kurang relevan', 'Relevan', 'Sangat relevan'] },
    clarity: { title: 'Kejelasan bahasa', labels: ['Tidak jelas', 'Kurang jelas', 'Jelas', 'Sangat jelas'] },
    realism: { title: 'Kewajaran situasi bagi prajurit', labels: ['Tidak wajar', 'Kurang wajar', 'Wajar', 'Sangat wajar'] },
    balance: { title: 'Keseimbangan daya tarik empat opsi', labels: ['Tidak seimbang', 'Kurang seimbang', 'Seimbang', 'Sangat seimbang'] },
    scoring: { title: 'Ketepatan urutan skor opsi', labels: ['Tidak tepat', 'Kurang tepat', 'Tepat', 'Sangat tepat'] }
  };
  const criterionKeys = config.criterionKeys || (isSjt ? ['realism','balance','scoring'] : ['relevance','clarity']);
  if (original) criterionKeys.forEach((key,i) => { criteria[key] = {title:original.criteria[i],labels:original.scales?.[i] || original.scaleLabels}; });
  if (el('purpose')) el('purpose').textContent = isSjt
    ? 'Menilai situasi dan dilema prajurit, keseimbangan serta kewajaran empat opsi jawaban, dan ketepatan skor opsi sesuai tiga kriteria pada formulir asli.'
    : 'Menilai relevansi setiap butir dengan definisi dimensinya serta kejelasan bahasa bagi calon responden. Bapak/Ibu menilai mutu butir sebagai ahli, bukan menjawab kuesioner sebagai prajurit.';
  el('scope').textContent = 'Form ini berisi ' + config.items.length + (isSjt ? ' skenario' : ' butir') + ' dalam 5 dimensi, diikuti rekomendasi akhir.';
  if (isSjt && original) {
    const list = document.createElement('ol'); list.className = 'intro-criteria';
    for (const key of criterionKeys) { const li = document.createElement('li'); li.textContent = criteria[key].title; list.append(li); }
    el('scales').append(list);
    original.scaleLabels.forEach((label, i) => {
      const row = document.createElement('li'); row.className = 'intro-score-row';
      const value = document.createElement('strong'), text = document.createElement('div');
      const lines = label.split('\n').map(line => line.trim()).filter(Boolean);
      const title = document.createElement('span'); title.className = 'intro-score-label'; title.textContent = lines[0]; text.append(title);
      if (lines.length > 1) {
        const note = document.createElement('small'); note.className = 'intro-score-note';
        note.textContent = lines.slice(1).join(' '); text.append(note);
      }
      value.textContent = String(i + 1); row.append(value, text); el('rating-scale').append(row);
    });
  } else for (const key of criterionKeys) {
    const section = document.createElement('section'), title = document.createElement('strong'), p = document.createElement('p');
    title.textContent = criteria[key].title;
    const list = document.createElement('ol'); list.className = 'criterion-rating-scale';
    criteria[key].labels.forEach((label,i) => { const row=document.createElement('li'); row.className='intro-score-row'; const number=document.createElement('strong'), text=document.createElement('span'); number.textContent=String(i+1); text.textContent=label; row.append(number,text); list.append(row); });
    section.append(title, list); el('scales').append(section);
  }
  const storageKey = 'expert-review-' + config.slug + (original ? (isSjt ? '-original-v2' : '-original-v3') : '-v1') + (config.simulation ? '-simulation' : '') + (config.previewPage ? '-preview-' + config.previewPage : '');
  const escape = text => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nameFor = item => 'item_' + item.id.replace('.', '_');
  const required = { isRequired: true, requiredErrorText: 'Lengkapi bagian ini untuk melanjutkan.' };
  function scenarioMarkup(item) {
    const options = item.options.map(option => {
      const parts = option.match(/^([A-D])\.\s+([\s\S]*?)\s*(\(Skor\s+\d+\))$/);
      if (!parts) return '<li><p>' + escape(option) + '</p></li>';
      return '<li class="sjt-option"><span class="sjt-option-letter" aria-hidden="true">' + parts[1] + '.</span><div><p>' + escape(parts[2]) + '</p><span class="sjt-option-score">' + escape(parts[3]) + '</span></div></li>';
    }).join('');
    return '<div class="sjt-stimulus">' +
      '<section class="sjt-dimension"><p class="sjt-label">Dimensi yang dinilai</p><h3>' + escape(item.name) + '</h3><p class="sjt-definition">' + escape(item.definition) + '</p></section>' +
      '<section class="sjt-situation"><h3>Situasi</h3><p>' + escape(item.text) + '</p></section>' +
      '<section class="sjt-options"><h3>Opsi jawaban dan skor</h3><ol aria-label="Opsi jawaban skenario">' + options + '</ol></section></div>';
  }
  function makeSurvey() {
    const identity = original ? [
      { type: 'text', name: 'expert_name', title: original.identityLabels[0], maxLength: 150, ...required },
      { type: 'text', name: 'position_unit', title: original.identityLabels[1], maxLength: 250, ...required },
      { type: 'text', name: 'years_service', title: original.identityLabels[2] + ' (Tahun)', inputType: 'number', min: 0, ...required },
      { type: 'text', name: 'assessment_date', title: original.identityLabels[3], inputType: 'date', ...required },
      { type: 'checkbox', name: 'consent', title: 'Persetujuan panelis ahli', choices: [{ value: 'agreed', text: original.consent }], ...required }
    ] : [
      { type: 'text', name: 'expert_name', title: 'Nama lengkap', maxLength: 150, ...required },
      { type: 'text', name: 'institution', title: 'Instansi atau satuan', maxLength: 200, ...required },
      { type: 'text', name: 'position', title: 'Jabatan atau profesi', maxLength: 150 },
      { type: 'text', name: 'expertise', title: 'Bidang keahlian', maxLength: 250, ...required },
      { type: 'text', name: 'years_service', title: 'Lama berdinas atau pengalaman di bidang terkait (tahun)', inputType: 'number', min: 0, max: 100 },
      { type: 'text', name: 'assessment_date', title: 'Tanggal penilaian', inputType: 'date', ...required },
      { type: 'checkbox', name: 'consent', title: 'Kesediaan menjadi panelis ahli', choices: [{ value: 'agreed', text: 'Saya bersedia menjadi panelis ahli untuk instrumen ini secara sukarela.' }], ...required }
    ];
    const pages = [{ name: 'identity', title: original ? 'Identitas Panelis Ahli' : 'Identitas panelis ahli', description: 'Isi identitas sesuai peran Bapak/Ibu dalam penelaahan instrumen ini.', elements: identity }];
    for (const [index, item] of config.items.entries()) {
      const id = nameFor(item);
      const stem = config.slug === 'kesiapan-penugasan' ? '<p>Seberapa yakin Anda bahwa Batalyon Anda secara kolektif mampu:</p>' : '';
      const source = isSjt ? scenarioMarkup(item) : '<div class="sjt-stimulus"><section class="sjt-dimension"><p class="sjt-label">Dimensi yang dinilai</p><h3>'+escape(item.name)+'</h3><p class="sjt-definition">'+escape(item.definition)+'</p></section><section class="sjt-situation"><h3>Pernyataan</h3>'+stem+'<p>'+escape(item.text)+'</p>'+(item.perspective ? '<p class="note">Sudut pandang: '+escape(item.perspective)+'</p>' : '')+(config.slug==='kesiapan-penugasan' ? '<p class="note">Skala jawaban prajurit: 0–100%.</p>' : '')+'</section></div>';
      pages.push({ name: id, title: (isSjt ? 'SOAL ' : 'BUTIR ') + item.id, description: '', elements: [
        { type: 'html', name: id + '_source', html: source },
        ...criterionKeys.map((key, i) => ({
          type: 'radiogroup', name: id + '_' + key, title: criteria[key].title, ...required, colCount: 1,
          choices: criteria[key].labels.map((text, j) => ({ value: j + 1, text: `${j + 1} — ${text}` })),
          showCommentArea: !cleanForm && i === criterionKeys.length - 1, commentText: original?.commentLabel || 'Komentar atau usulan perbaikan untuk butir ini (opsional)', commentPlaceholder: 'Alasan penilaian atau usulan redaksi…'
        })),
        ...(cleanForm ? [{ type: 'comment', name: id + '_feedback', title: original?.commentLabel || 'Masukan dari Panelis Ahli (jika ada)', placeholder: isSjt ? 'Saran skenario, opsi, atau urutan skor…' : 'Catatan atau usulan perbaikan untuk butir ini…', autoGrow: true, maxLength: 10000 }] : [])
      ] });
    }
    pages.push({ name: 'recommendation', title: original ? 'Kesimpulan dan Rekomendasi' : 'Kesimpulan dan rekomendasi', elements: [
      { type: 'radiogroup', name: 'recommendation', title: original?.conclusion || 'Rekomendasi keseluruhan untuk instrumen ini', ...required, choices: original ? original.recommendations.map((text, i) => ({ value: ['ready', 'minor', 'major'][i], text })) : [
        { value: 'ready', text: 'Layak digunakan tanpa revisi; siap untuk uji coba lapangan.' },
        { value: 'minor', text: 'Layak digunakan dengan revisi kecil sesuai catatan penelaahan.' },
        { value: 'major', text: 'Perlu diskusi atau revisi mayor sebelum diterapkan.' }
      ] },
      { type: 'comment', name: 'general_notes', title: 'Catatan umum dan rekomendasi perbaikan (opsional)', autoGrow: true }
    ] });
    return { pages, title: '', showTitle: !cleanForm, textUpdateMode: 'onTyping', showQuestionNumbers: 'off', showProgressBar: 'top', progressBarType: 'pages', showPreviewBeforeComplete: cleanForm ? 'noPreview' : 'showAnsweredQuestions', previewText: 'Tinjau seluruh penilaian', editText: 'Kembali mengisi', completeText: cleanForm ? 'Kirim penilaian' : 'Selesaikan penilaian', pageNextText: 'Berikutnya', pagePrevText: 'Sebelumnya', widthMode: 'responsive', autoGrowComment: true, focusFirstQuestionAutomatic: false, requiredText: '*' };
  }
  const survey = new Survey.Model(makeSurvey());
  let savingAvailable = true, saved;
  try { saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch (_) { savingAvailable = false; }
  if (!saved && config.simulation && config.simulationAnswers) saved = { answers: config.simulationAnswers, page: 1 };
  if (saved?.answers && typeof saved.answers === 'object') {
    const answers = { ...saved.answers };
    if (isSjt) for (const item of config.items) {
      const prefix = nameFor(item), legacy = prefix + '_scoring-Comment';
      if (answers[prefix + '_feedback'] === undefined && answers[legacy] !== undefined) answers[prefix + '_feedback'] = answers[legacy];
      delete answers[legacy];
    }
    survey.data = answers; survey.currentPageNo = Math.max(0, Math.min(saved.page || 0, survey.pages.length - 1)); el('start').textContent = 'Lanjutkan penilaian';
  }
  if (isSjt) { survey.setValue('signature', undefined); survey.setValue('signer_name', undefined); }
  const online = cleanForm && !config.simulation && !config.previewPage;
  let receipt = null, sending = false, confirmed = false;
  function submissionAnswers() {
    const answers = {};
    for (const q of survey.getAllQuestions()) {
      if (q.getType() === 'html' || (isSjt && q.name.endsWith('_feedback'))) continue;
      if (survey.data[q.name] !== undefined) answers[q.name] = survey.data[q.name];
      if (q.showCommentArea && survey.getComment(q.name)) answers[q.name + '-Comment'] = survey.getComment(q.name);
    }
    if (isSjt) for (const item of config.items) {
      const prefix = nameFor(item), feedback = survey.getValue(prefix + '_feedback');
      if (feedback) answers[prefix + '_scoring-Comment'] = feedback;
    }
    answers.years_service = Number(answers.years_service);
    return answers;
  }
  survey.onCompleting.add((sender, options) => {
    if (!online || confirmed) return;
    options.allowComplete = false;
    if (sending) return;
    if (!window.SjtSubmission) { el('status').textContent = 'Koneksi pengiriman belum tersedia. Muat ulang halaman lalu coba lagi.'; return; }
    persist(); sending = true; sender.readOnly = true; sender.completeText = 'Mengirim…';
    el('status').textContent = 'Sedang mengirim penilaian. Mohon tunggu.';
    window.SjtSubmission.submit(submissionAnswers()).then(result => {
      receipt = result; confirmed = true; sender.readOnly = false; sender.doComplete();
    }).catch(error => {
      el('status').textContent = error.message || 'Pengiriman belum berhasil. Silakan coba lagi.';
    }).finally(() => { sending = false; sender.readOnly = false; sender.completeText = 'Kirim penilaian'; });
  });
  function persist() {
    const record = { instrument: config.slug, answers: survey.data, page: survey.currentPageNo, updatedAt: new Date().toISOString() };
    try { localStorage.setItem(storageKey, JSON.stringify(record)); savingAvailable = true; } catch (_) { savingAvailable = false; }
    el('status').textContent = savingAvailable ? (cleanForm ? '' : 'Draf tersimpan di browser perangkat ini. Belum dikirim kepada peneliti.') : (cleanForm ? 'Penyimpanan otomatis tidak tersedia. Selesaikan pengisian dan kirim penilaian sebelum menutup halaman ini.' : 'Penyimpanan otomatis tidak tersedia. Unduh draf untuk menyimpan salinan jawaban.');
  }
  survey.onValueChanged.add(persist); survey.onCurrentPageChanged.add(persist);
  function showForm() {
    if (survey.isCompleted) survey.clear(false, true);
    el('intro').hidden = true; el('result').hidden = true; el('survey').hidden = false; el('tools').hidden = false;
    el('survey').replaceChildren(); const mount = document.createElement('div'); el('survey').append(mount); survey.render(mount);
    el('status').textContent = savingAvailable ? (cleanForm ? '' : 'Nilai bertanda * wajib diisi. Komentar bersifat opsional.') : (cleanForm ? 'Penyimpanan otomatis tidak tersedia. Selesaikan pengisian dan kirim penilaian sebelum menutup halaman ini.' : 'Penyimpanan otomatis tidak tersedia. Unduh draf sebelum menutup form.');
  }
  function showIntro() {
    persist(); el('intro').hidden = false; el('survey').hidden = true; el('result').hidden = true; el('tools').hidden = true; el('start').textContent = 'Lanjutkan penilaian';
  }
  function summary() {
    const container = el('summary'); container.replaceChildren();
    for (const [title, value] of [['Panelis ahli', survey.getValue('expert_name')], ['Instrumen', config.title], ['Jumlah ' + (isSjt ? 'skenario' : 'butir'), config.items.length], ['Rekomendasi', survey.getQuestionByName('recommendation').displayValue]]) {
      const p = document.createElement('p'); p.textContent = title + ': ' + value; container.append(p);
    }
  }
  survey.onComplete.add(() => {
    persist(); el('survey').hidden = true; el('intro').hidden = true; el('result').hidden = false; el('tools').hidden = true;
    if (cleanForm) {
      el('result-title').textContent = config.simulation ? 'Simulasi selesai' : 'Terima kasih';
      el('result-message').textContent = receipt
        ? 'Penilaian Bapak/Ibu telah kami terima. Terima kasih atas waktu dan masukan yang diberikan.'
        : 'Terima kasih atas waktu dan masukan Bapak/Ibu.';
      el('status').textContent = '';
      return;
    }
    summary();
    if (receipt) {
      el('result-title').textContent = 'Penilaian berhasil dikirim';
      el('result-message').textContent = 'Terima kasih. Penilaian Bapak/Ibu telah diterima oleh peneliti. Salinan hasil dapat diunduh di bawah ini.';
      el('edit').hidden = true; el('status').textContent = 'Nomor penerimaan: ' + receipt.id;
    } else el('status').textContent = 'Penilaian selesai. Unduh hasil untuk dikembalikan kepada peneliti.';
  });
  function download(text, extension, mime, draft = false) {
    const url = URL.createObjectURL(new Blob([text], { type: mime })); const a = document.createElement('a');
    a.href = url; a.download = config.slug + (draft ? '-draf-' : '-hasil-') + new Date().toISOString().slice(0, 10) + '.' + extension; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function json(draft = false) { download(JSON.stringify({ schemaVersion: 1, instrument: config.slug, title: config.title, simulation: Boolean(config.simulation), completed: !draft && survey.isCompleted, receipt, exportedAt: new Date().toISOString(), page: survey.currentPageNo, answers: isSjt ? submissionAnswers() : survey.data }, null, 2), 'json', 'application/json', draft); }
  function csv() {
    const identityKeys = original ? ['expert_name', 'position_unit', 'years_service', 'assessment_date', 'consent'] : ['expert_name','institution','position','expertise','years_service','assessment_date','consent'];
    const rows = [['instrument', ...identityKeys, 'item', 'dimension', 'source_text', 'options', ...criterionKeys, 'comment', 'recommendation', 'general_notes']];
    for (const item of config.items) {
      const prefix = nameFor(item);
      rows.push([config.slug, ...identityKeys.map(k => survey.getValue(k) ?? ''), item.id, item.name, item.text, (item.options || []).join('\n'), ...criterionKeys.map(k => survey.getValue(prefix + '_' + k) ?? ''), (cleanForm ? survey.getValue(prefix + '_feedback') : survey.getComment(prefix + '_' + criterionKeys.at(-1))) || '', survey.getValue('recommendation') || '', survey.getValue('general_notes') || '']);
    }
    const cell = value => { let s = Array.isArray(value) ? value.join('; ') : String(value); if (/^[=+@\-\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    download('\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n'), 'csv', 'text/csv;charset=utf-8');
  }
  el('start').addEventListener('click', showForm); el('guide').addEventListener('click', showIntro);
  if (!cleanForm || config.simulation) {
    el('draft')?.addEventListener('click', () => { persist(); json(true); }); el('json')?.addEventListener('click', () => json()); el('csv')?.addEventListener('click', csv);
    el('edit')?.addEventListener('click', () => { const data = { ...survey.data }; survey.clear(false, true); survey.data = data; survey.currentPageNo = survey.pages.length - 1; showForm(); });
  }
  if (config.previewPage === 'recommendation') {
    survey.currentPageNo = survey.pages.length - 1;
    showForm();
  }
})();

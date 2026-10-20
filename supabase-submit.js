(function (root) {
  'use strict';
  function createSubmissionClient(config, deps = {}) {
    const request = deps.fetch || root.fetch.bind(root);
    const storage = deps.storage || (() => { try { return root.localStorage; } catch (_) { return null; } })();
    const uuid = deps.uuid || (() => root.crypto.randomUUID());
    const endpoint = new URL('/rest/v1/rpc/submit_sjt_review', config.url);
    if (endpoint.protocol !== 'https:' || !config.publishableKey?.startsWith('sb_publishable_')) throw new Error('Konfigurasi pengiriman tidak valid.');
    const storageKey = 'sjt-supabase-pending-v1@' + endpoint.host;
    let pending;
    try { pending = JSON.parse(storage?.getItem(storageKey) || 'null'); } catch (_) {}
    let inflight = false;
    const save = () => { try { storage?.setItem(storageKey, JSON.stringify(pending)); } catch (_) {} };
    return {
      async submit(answers) {
        if (inflight) throw new Error('Pengiriman sedang berlangsung.');
        const fingerprint = JSON.stringify(answers);
        if (!pending || pending.fingerprint !== fingerprint) pending = { id: uuid(), fingerprint };
        if (pending.receipt) return pending.receipt;
        save();
        inflight = true;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 20000);
        try {
          const response = await request(endpoint.href, {
            method: 'POST', headers: { apikey: config.publishableKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ p_submission_id: pending.id, p_answers: answers }), signal: controller.signal
          });
          if (!response.ok) throw new Error(response.status === 400 ? 'Data belum dapat diterima. Periksa kelengkapan jawaban lalu coba lagi.' : 'Pengiriman belum berhasil. Jawaban tetap tersimpan; silakan coba lagi.');
          const receipt = await response.json();
          if (receipt.id !== pending.id || !receipt.received_at) throw new Error('Tanda terima belum terkonfirmasi. Silakan coba kirim kembali.');
          pending.receipt = receipt; save(); return receipt;
        } catch (error) {
          if (error.name === 'AbortError' || error instanceof TypeError) throw new Error('Koneksi terputus atau terlalu lama. Jawaban tetap tersimpan; silakan kirim kembali.');
          throw error;
        } finally { clearTimeout(timer); inflight = false; }
      }
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { createSubmissionClient };
  else if (root.SJT_BACKEND) root.SjtSubmission = createSubmissionClient(root.SJT_BACKEND);
})(typeof window === 'undefined' ? globalThis : window);

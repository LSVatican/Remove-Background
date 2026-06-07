document.addEventListener('DOMContentLoaded', () => {
    // 1. Inisialisasi Saldo Default (Jika pengguna baru, beri 0 atau 50)
    if (localStorage.getItem('userCredits') === null) {
        localStorage.setItem('userCredits', '50'); 
    }
    updateCreditDisplay();

    // 2. Jalankan Jam Real-Time
    startRealTimeClock();

    // 3. Cek Sistem Check-In Harian
    checkDailyBonus();

    // 4. Logika Input File di Beranda
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    if (dropZone) {
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                // Cek apakah saldo cukup SEBELUM memproses ke API (Biaya 10 kredit)
                let currentCredits = parseInt(localStorage.getItem('userCredits') || 0);
                if (currentCredits < 10) {
                    alert('⚠️ Saldo Kredit Anda tidak cukup! Silakan check-in harian terlebih dahulu.');
                    return;
                }
                prosesHapusBackground(e.target.files[0]);
            }
        });
    }
});

// Fungsi Update Tampilan Saldo di Semua Halaman yang Memiliki ID 'creditBalance'
function updateCreditDisplay() {
    const creditDisplays = document.querySelectorAll('#creditBalance');
    const saldo = localStorage.getItem('userCredits') || 0;
    creditDisplays.forEach(el => el.textContent = saldo);
}

// Jam Real-Time Menyesuaikan Waktu Pengguna Saat Ini
function startRealTimeClock() {
    const clockEl = document.getElementById('realTimeClock');
    if (!clockEl) return;

    const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    
    setInterval(() => {
        const now = new Date();
        const hari = namaHari[now.getDay()];
        const jam = String(now.getHours()).padStart(2, '0');
        const menit = String(now.getMinutes()).padStart(2, '0');
        const detik = String(now.getSeconds()).padStart(2, '0');
        
        clockEl.textContent = `${hari}, ${jam}:${menit}:${detik}`;
    }, 1000);
}

// Sistem Check-In Harian (Pop-Up)
function checkDailyBonus() {
    const checkInPopup = document.getElementById('checkInPopup');
    if (!checkInPopup) return;

    const todayStr = new Date().toDateString(); // Format: "Mon Jun 08 2026"
    const lastCheckIn = localStorage.getItem('lastCheckInDate');

    // Jika belum pernah check-in atau hari ini belum check-in
    if (lastCheckIn !== todayStr) {
        const currentDayIndex = new Date().getDay(); // 0 = Minggu, 1 = Senin, dst.
        
        // Atur nominal hadiah acak/tetap kisaran 20 - 150 kredit berdasarkan hari
        const daftarHadiah = [150, 20, 30, 40, 50, 60, 80]; // Index 0=Minggu, 1=Senin...
        const bonusHariIni = daftarHadiah[currentDayIndex] || 20;

        // Tampilkan info di pop-up
        document.getElementById('bonusAmount').textContent = bonusHariIni;
        checkInPopup.style.display = 'flex';

        // Logika Tombol Klaim
        document.getElementById('btnClaimCheckIn').onclick = () => {
            let currentCredits = parseInt(localStorage.getItem('userCredits') || 0);
            localStorage.setItem('userCredits', currentCredits + bonusHariIni);
            localStorage.setItem('lastCheckInDate', todayStr);
            
            updateCreditDisplay();
            checkInPopup.style.display = 'none';
            alert(`🎉 Berhasil mengklaim ${bonusHariIni} Kredit harian!`);
        };
    }
}

// Proses API Remove.bg
async function prosesHapusBackground(fileData) {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'block';

    const formData = new FormData();
    formData.append('image_file', fileData);
    formData.append('size', 'auto');

    const apiKey = '2A6Hv7H3oMBwtESDnbPNe2Co'; 

    try {
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: { 'X-Api-Key': apiKey },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.errors[0].title || 'Gagal memproses gambar.');
        }

        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function () {
            localStorage.setItem('processedImage', reader.result);
            // Pindah ke halaman hasil
            window.location.href = 'hasil.html';
        };

    } catch (error) {
        alert("Error: " + error.message);
        if (loading) loading.style.display = 'none';
    }
}

# KronikAraba — 07.06.2026 Genel İyileştirme Planı

Sitede tespit edilen eksikliklerin kapsamlı iyileştirme planı. Mevcut mimariyi (Vite + React CSR + Vercel Blob) koruyarak, tek oturumda uygulanabilecek, somut ve ölçülebilir 6 büyük iyileştirme.

> [!IMPORTANT]
> Bu plan mevcut dosya yapısını ve altyapıyı bozmadan, adım adım uygulanmak üzere tasarlanmıştır. React Router gibi büyük bağımlılık eklenmeyecek; mevcut pushState/popState sistemi korunacaktır.

---

## 1. Footer Bileşeni (Eksik — Hiç Yok)

Site genelinde **footer** yok. Profesyonel bir sitede mutlaka olmalı.

### [NEW] `src/Footer.jsx`
- Site hakkında kısa bilgi, logo
- Hızlı linkler (Ana Sayfa, Markalar, Modeller, Uzman Görüşleri, Masraf Rehberi, Makaleler)
- İletişim/Sosyal medya ikonları (placeholder)
- "© 2026 KronikAraba — Tüm hakları saklıdır." 
- Dark mode uyumlu

### [MODIFY] `src/App.jsx`
- Footer bileşenini import edip render ağacının sonuna ekle

### [MODIFY] `src/index.css`
- Footer için CSS stilleri (modern, koyu arkalık, grid layout)

---

## 2. Kullanıcı Profil Sayfası (Eksik — Hiç Yok)

Giriş yapmış kullanıcıların **kendi aktivitelerini** görebileceği bir sayfa.

### [NEW] `src/ProfilePage.jsx`
- Kullanıcı bilgileri (avatar, kullanıcı adı, e-posta)
- "Doğruladığım Arızalar" listesi (`localStorage ka_verified_*` anahtarlarından)
- "Önerdiğim Arızalar" listesi (pending verilerinden eşleştirme)
- İstatistik kartları (kaç doğrulama, kaç yorum vb.)
- Şifre değiştirme formu (mevcut/yeni şifre)

### [MODIFY] `src/App.jsx`
- `activeView === 'profile'` durumu ekleme
- UserMenu'ye "Profilim" linki ekleme
- URL yönetimi: `/profil`

### [MODIFY] `src/index.css`
- Profil sayfası CSS stilleri

---

## 3. Şifremi Unuttum Akışı (Eksik)

Kullanıcılar şifrelerini unuttuysa sıfırlama yapabilmeli. E-posta gönderme altyapısı olmadığı için, güvenlik sorusu veya kullanıcı adı + e-posta doğrulaması ile sıfırlama yapılacak.

### [MODIFY] `src/auth.jsx`
- "Şifremi Unuttum" linki ekleme (login tabının altına)
- Yeni `ForgotPasswordForm` alt bileşeni:
  - Kullanıcı adı/e-posta gir → eşleşen hesabı bul
  - Yeni şifre belirleme formu (en az 6 karakter)
  - `loadUsers` / `saveUsers` ile şifreyi güncelleme
- Toast mesajı: "Şifreniz başarıyla güncellendi!"

### [MODIFY] `src/index.css`
- Şifremi unuttum formu için CSS

---

## 4. Detaylı Arama Modalında Bağımlı Filtreleme (Eksik)

Marka seçildiğinde o markaya ait modellerin dinamik olarak gösterilmesi.

### [MODIFY] `src/App.jsx` — `AdvancedFilterModal` bileşeni
- `allData` prop'u ekle (tüm arıza verileri)
- Marka seçim dropdown'u ekle
- Marka seçilince o markaya ait modelleri otomatik listele
- Motor tipi dropdown'u ekle
- Kategori seçimi dropdown'u ekle

---

## 5. Araç Kartlarına Marka Logoları / Renkli Görseller (Eksik)

AllModelsPage ve LandingPage'deki kartlarda araç/marka görselleri bulunmuyor, sadece harfler var.

### [MODIFY] `src/LandingPage.jsx`
- Marka butonlarına SVG marka logoları ekleme (basit harfli daireler yerine gerçek kısaltma + gradient arka plan)
- Arıza kartlarına marka renk şeridi ekleme

### [MODIFY] `src/AllModelsPage.jsx`
- Model kartlarına marka renginde gradient header ekleme
- Kartlara araç siluet ikonu ekleme (SVG)

### [MODIFY] `src/index.css`
- Kart görsel iyileştirmeleri için CSS

---

## 6. Scroll-to-Top Butonu ve Sayfa Geçiş Animasyonları (Eksik)

Uzun sayfalarda kullanıcının en üste dönmesini sağlayan buton ve sayfa geçişlerinde yumuşak animasyonlar.

### [NEW] `src/ScrollToTop.jsx`
- Sayfa 300px+ scroll edildiğinde görünen "↑" butonu
- Tıklandığında `window.scrollTo({ top: 0, behavior: 'smooth' })` 
- Fade in/out animasyonu

### [MODIFY] `src/App.jsx`
- `ScrollToTop` bileşenini ekle
- Sayfa geçişlerinde `window.scrollTo(0, 0)` çağrıları

### [MODIFY] `src/index.css`
- ScrollToTop butonu CSS
- Sayfa geçiş animasyonları (fade-in)

---

## Proposed Changes Summary

### Yeni Dosyalar
| Dosya | Açıklama |
|-------|----------|
| `src/Footer.jsx` | Site geneli footer bileşeni |
| `src/ProfilePage.jsx` | Kullanıcı profil sayfası |
| `src/ScrollToTop.jsx` | Scroll-to-top butonu |

### Değiştirilecek Dosyalar
| Dosya | Değişiklik |
|-------|-----------|
| `src/App.jsx` | Footer, ProfilePage, ScrollToTop entegrasyonu; AdvancedFilterModal bağımlı filtre; sayfa geçiş scroll |
| `src/auth.jsx` | Şifremi unuttum formu |
| `src/LandingPage.jsx` | Marka butonlarına gradient/renk iyileştirmesi |
| `src/AllModelsPage.jsx` | Model kartlarına gradient header, araç ikonu |
| `src/index.css` | Tüm yeni bileşenler için CSS stilleri |

---

## Verification Plan

### Manual Verification
- `npm run dev` ile yerel sunucuda çalıştır
- Tüm yeni sayfa ve bileşenleri tarayıcıda test et:
  - Footer her sayfada görünüyor mu?
  - Profil sayfası doğru kullanıcı verilerini gösteriyor mu?
  - Şifremi unuttum akışı çalışıyor mu?
  - Detaylı aramada marka seçince modeller filtreleniyor mu?
  - Scroll-to-top butonu 300px scroll sonrası görünüyor mu?
  - Dark mode'da tüm yeni bileşenler doğru görünüyor mu?
- `npm run build` ile production build hatası olmadığını doğrula

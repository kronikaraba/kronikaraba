# KronikAraba — Tasarım Eleştirisi & Yeni Arayüz Planı

---

## 🔴 SERT ELEŞTİRİ

### 1. Görsel Kimlik: Yok Sayılmış

Siteye ilk girişte "Bu da ne?" tepkisi vermemek mümkün değil.
**Renk paleti, tasarım kararı değil — tasarımdan kaçış.**  
Gri tonlar, beyaz arka plan, mavi linkler. Bu 2012'de bile sıradan sayılırdı.

Otomobil, tutkuyu, adrenalin oktan sayısını temsil eder. Sitede bunun hiçbir izi yok.  
Bir araba satın almadan önce kullanıcı bu sabit sitede güven aramalı — ama görsel kimlik, güveni yok etmek için sanki özellikle tasarlanmış.

---

### 2. Marka Temsili: Tam Bir Fiyasko

````carousel
![Ana sayfa görünümü](C:\Users\Emin\.gemini\antigravity-ide\brain\56885189-1a4b-42be-bedd-ec64ba506900\homepage_viewport_1780858821558.png)
<!-- slide -->
![Markalar sayfası](C:\Users\Emin\.gemini\antigravity-ide\brain\56885189-1a4b-42be-bedd-ec64ba506900\markalar_page_1780858835488.png)
<!-- slide -->
![Modeller sayfası](C:\Users\Emin\.gemini\antigravity-ide\brain\56885189-1a4b-42be-bedd-ec64ba506900\modeller_page_1780858851901.png)
<!-- slide -->
![Arıza detay sayfası](C:\Users\Emin\.gemini\antigravity-ide\brain\56885189-1a4b-42be-bedd-ec64ba506900\fault_detail_page_1780858912483.png)
````

**Volkswagen → "VO", Renault → "RE", BMW → "BM".**  
Bu bir hobi projesi bile olsa kabul edilemez. Dünyanın en tanınan otomobil markalarını iki harf kısaltmasıyla temsil etmek, Rolls-Royce'u "RR" yazarak satmaya çalışmak gibi.  
Gerçek SVG marka logolar açık lisanslı kaynaklardan temin edilebilir. Bunun bir mazereti yok.

---

### 3. Ana Sayfa: Dikkat Dağıtan Kaos

Ana sayfada **20'den fazla popüler etiket butonu** yan yana yığılmış durumda.
Kullanıcı gözü bu buton ormanında ne arayacağını bilemiyor.  
"Popüler" dediğimiz şey 5-6 öğeyle verilmesi gereken bir vurgudur — 20+ buton ile **hiçbiri popüler olmaz**, hepsi gürültüdür.

Arama barı var ama **görsel ağırlığı yok**. Sayfanın en kritik elamanı olması gerekirken, 10. sıraya düşmüş durumda.

---

### 4. Filtre Sistemi: Saldırgan ve Kullanımsız

**"Modeller" sayfasında** 30'dan fazla marka butonu, 4-5 satır halinde üst üste dizilmiş.  
Bu bir filtre değil, ekranı kirleten bir duvar.  
Mobil ekranda bu sayfanın nasıl göründüğünü hayal etmek bile istemiyorum.  
Kullanıcı, filtrelemek istediği markayı bulmak için önce filtre kartını taramak zorunda — bu UX mühendisliğinin tam tersi.

---

### 5. Veri Gösterimi: Sistemik Hata İzlenimi

Arıza kartlarında `Masraf: ₺0 – ₺0` ve `Görülme KM: 0` değerleri görünüyor.  
Veri yoksa **"Belirtilmemiş"** veya **"Veri yok"** gösterin.  
Sıfır göstermek, sisteme hiç veri girilmemiş ya da sistem bozuk izlenimi veriyor.  
Kullanıcı güveni bu küçük detaylarda kazanılır ya da kaybedilir.

---

### 6. "Masraf Sihirbazı": Gizlenmiş Hazine

Bu araç, sitenin en değerli özelliği olabilir. Ama sayfada öyle sıradan, öyle gömülü bir buton ki, kullanıcıların büyük çoğunluğu fark etmeden çıkıyor. Bir özelliği varsa onu sat. Bu sihirbaz ana sayfada **widget olarak** olmalı.

---

### 7. Footer: Bitmemiş Proje Görüntüsü

Sosyal medya ikonlarının tamamı `href="#"` ile bağlı.  
Bu, canlıya alınmış ama yarım bırakılmış proje işareti.  
Ziyaretçi Twitter/Instagram ikonuna tıkladığında sayfanın başına zıplarsa güven sıfırlanır.

---

## 🎯 YENİ ARAYÜZ PLANI

> [!IMPORTANT]
> Bu plan sadece tasarım yönlendirmesi içermektedir. Uygulama yapılmamıştır.

---

### TASARIM SİSTEMİ

| Token | Değer |
|---|---|
| **Primary** | `hsl(220, 90%, 56%)` — Canlı Mavi |
| **Accent** | `hsl(15, 90%, 55%)` — Araba Turuncusu |
| **Danger** | `hsl(0, 80%, 58%)` — Risk Kırmızısı |
| **Success** | `hsl(142, 70%, 45%)` — Güvenli Yeşil |
| **Background** | `hsl(220, 20%, 8%)` — Derin Koyu |
| **Surface** | `hsl(220, 15%, 13%)` — Kart Arka Planı |
| **Text Primary** | `hsl(0, 0%, 96%)` |
| **Text Muted** | `hsl(220, 10%, 55%)` |
| **Font** | Inter, Plus Jakarta Sans |

**Mod**: Koyu tema (Dark Mode) ana tema olmalı. Otomotiv = gece, yol ışıkları, hız.

---

### SAYFA BAZLI PLAN

#### 🏠 1. Ana Sayfa (Homepage)

**Mevcut sorun**: Anlamsız buton kalabalığı, zayıf hiyerarşi  
**Çözüm**:

```
┌─────────────────────────────────────────────────────────┐
│  NAVBAR — Logo | Nav Links | Giriş Yap Butonu           │
├─────────────────────────────────────────────────────────┤
│  HERO ALANI                                             │
│  ─ Büyük, güçlü başlık: "İkinci El Arabanın            │
│    Gizli Sorunlarını Öğren"                             │
│  ─ Alt başlık + büyük, odak noktası arama barı          │
│  ─ Sadece 5-6 trending marka ikonu (gerçek logolar)     │
├─────────────────────────────────────────────────────────┤
│  MASRAF SİHİRBAZI WIDGET (Mini / Inline)               │
│  ─ Marka Seç > Model Seç > Kategori > "Hesapla"        │
│  ─ Sonuç: Tahmini masraf aralığı inline gösterim       │
├─────────────────────────────────────────────────────────┤
│  SON ARIZA İLANLARI (Grid — 3 kolon)                   │
│  ─ Her kart: Marka logosu, model, arıza özeti,          │
│    risk badge (Kırmızı/Turuncu/Yeşil), tarih           │
├─────────────────────────────────────────────────────────┤
│  FOOTER — Gerçek sosyal medya linkleri + site haritası  │
└─────────────────────────────────────────────────────────┘
```

---

#### 🏷️ 2. Markalar Sayfası

**Mevcut sorun**: İki harfli kısaltmalar, düz liste  
**Çözüm**:
- **Gerçek SVG marka logoları** ile kart grid düzeni (4 kolon desktop, 2 kolon mobil)
- Her marka kartında: Logo + Marka adı + Toplam arıza sayısı sayacı
- Hover'da kart hafifçe yükselir (lift effect), gölge belirginleşir
- A-Z sıralama ve arıza sayısına göre sıralama seçenekleri

---

#### 🚗 3. Modeller Sayfası

**Mevcut sorun**: 30+ buton duvarı, filtreleme kullanımsız  
**Çözüm**:
- **Sol sidebar**: Akordeon filtreleme paneli
  - Marka (tek seçim veya çoklu checkbox)
  - Yıl aralığı (slider)
  - Kategori
- **Sağ alan**: Model kartları, sonsuz scroll veya pagination
- Mobil: Sidebar alt çekmeceden açılır (bottom sheet)

---

#### ⚠️ 4. Arıza İlanları Listesi

**Mevcut sorun**: Veri yokken sıfır gösterimi, düz liste  
**Çözüm**:
- **Boş veri kuralı**: `₺0` → `"Belirtilmemiş"`, `KM: 0` → `"–"`
- Her kart:
  - Risk seviyesi badge (renk kodlu)
  - Marka logosu + Model adı
  - Arıza özeti (2 satır truncate)
  - "X kişi de yaşadı" sosyal kanıt satırı
  - Görüntülenme sayısı
- Filtreleme: Sağ üstte dropdown sıralama (En Yeni, En Çok Yaşanan, Risk Seviyesi)

---

#### 🔍 5. Arıza Detay Sayfası

**Mevcut sorun**: CTA butonu gömülü kalmış, veri yokken sıfır  
**Çözüm**:
- **İki sütun layout** (desktop):
  - Sol (70%): Arıza başlık, açıklama, masraf bilgileri, KM verisi
  - Sağ (30%): **Sticky aksiyon paneli** — "Ben de yaşadım" butonu + paylaşım
- **Kilometre-Sıklık Grafiği**: Hangi KM aralığında bu arıza çok yaşanmış? Bar/line chart ile görselleştir
- **"Ben de yaşadım" akışı**: Modal açılır, kullanıcı kendi KM ve masraf değerini girer → veri katkısı gamification'ı

---

#### 🧙 6. Masraf Sihirbazı (Masraf Rehberi)

**Mevcut sorun**: Standart bir sayfa, sihir yok  
**Çözüm**:
- **Step-by-step sihirbaz akışı** (multi-step form):
  - Adım 1: Marka seç (logo grid)
  - Adım 2: Model seç
  - Adım 3: Hangi parça/kategori
  - Adım 4: Sonuç kartı — min/max masraf, ortalama, grafik
- Progress bar üstte görünür
- Sonuç sayfasında "Bu arızayı raporla" CTA'sı

---

### 📐 KOMPONENTLERİN TASARIM DİLİ

| Komponent | Tasarım Notu |
|---|---|
| **Kart** | Koyu surface rengi, ince border (`1px solid rgba(255,255,255,0.08)`), 12px radius, hover'da lift |
| **Badge/Etiket** | Dolu arka plan, küçük radius, risk rengi (kırmızı/turuncu/yeşil) |
| **Buton (Primary)** | Gradient (mavi→lacivert), hover'da parlama efekti |
| **Arama Barı** | Büyük (56px height), ince glow efekti focus'ta |
| **Nav** | Frosted glass (backdrop-filter: blur), scroll sonrası belirginleşir |
| **Animasyon** | `transition: all 200ms ease` genel kural, card hover `translateY(-4px)` |

---

### 📱 MOBİL ÖNCELİKLİ NOTLAR

- Filtre paneli: Bottom sheet (aşağıdan açılan çekmece)
- Arıza detay sticky butonu: Sayfanın altında sabit floating CTA
- Marka logoları: 2 kolon grid, minimum 80px tıklanabilir alan
- Nav: Hamburger menü, tam ekran overlay

---

> [!TIP]
> Uygulamaya başlarken önce **tasarım sistemi (token'lar, renkler, tipografi)** kurun. Sonra **homepage hero** ile başlayın — en yüksek etki, en hızlı görünür değişim orada olacak.

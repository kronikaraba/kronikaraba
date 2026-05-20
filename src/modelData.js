// Extended model detail data for blog-style pages
export const modelDetails = {
  "Golf 1.4 TSI": {
    heroTitle: "Volkswagen Golf 1.4 TSI",
    heroSubtitle: "2013–2019 · Kompakt Sınıf · Benzinli Turbo",
    blogIntro: "Volkswagen Golf 1.4 TSI, kompakt sınıfın en popüler modellerinden biri olarak Türkiye'de büyük bir kullanıcı kitlesine sahiptir. 150 HP güç üreten 1.4 litrelik turbo benzinli motor, şehir içi ve şehirlerarası kullanımda dengeli bir performans sunar. Ancak belirli kilometre aralıklarında bilinen kronik arızaları mevcuttur.",
    specs: {
      motor: "1.4L TSI (EA211)", beygir: "150 HP", tork: "250 Nm",
      sanziman: "7 İleri DSG / 6 İleri Manuel", yakit: "5.2L / 100km (karma)",
      hiz: "0-100: 8.2 sn", agirlik: "1.280 kg", bagaj: "380 L"
    },
    strengths: ["Düşük yakıt tüketimi", "Güçlü turbo performansı", "Geniş yedek parça ağı", "Yüksek ikinci el değeri"],
    weaknesses: ["Zincir seti problemi (60K+ km)", "DSG bakım maliyetleri", "Turbo hortum yağ kaçağı riski"],
    maintenanceTips: [
      { km: "10.000 km", tip: "Motor yağı ve filtre değişimi (5W-30 tam sentetik)" },
      { km: "40.000 km", tip: "DSG şanzıman yağı değişimi (zorunlu)" },
      { km: "60.000 km", tip: "Zincir seti kontrol (ses dinleme)" },
      { km: "80.000 km", tip: "Bujiler + hava filtresi + yakıt filtresi" },
    ],
    buyerAdvice: "Satın almadan önce mutlaka soğuk çalıştırma testi yapın. Zincir sesi olup olmadığını kontrol edin. DSG bakım geçmişini isteyin — 40.000 km'de yapılmamışsa risklidir.",
  },
  "Passat 2.0 TDI": {
    heroTitle: "Volkswagen Passat 2.0 TDI",
    heroSubtitle: "2015–2020 · D Segment · Dizel Turbo",
    blogIntro: "Volkswagen Passat 2.0 TDI, D segmentin en çok tercih edilen dizel sedanlarından biridir. 150 HP güç ve 340 Nm tork ile özellikle uzun yol kullanımında konfor ve ekonomi sunar. Geniş iç hacmi ve zengin donanım seçenekleriyle aileler için ideal bir tercihtir.",
    specs: {
      motor: "2.0L TDI (EA288)", beygir: "150 HP", tork: "340 Nm",
      sanziman: "6 İleri DSG", yakit: "4.8L / 100km (karma)",
      hiz: "0-100: 8.7 sn", agirlik: "1.480 kg", bagaj: "586 L"
    },
    strengths: ["Yüksek tork değeri", "Düşük yakıt tüketimi", "Geniş bagaj hacmi", "Konforlu süspansiyon"],
    weaknesses: ["Turbo hortumu yağ kaçağı", "AdBlue sistem arızaları", "DPF tıkanma riski (şehir içi)"],
    maintenanceTips: [
      { km: "15.000 km", tip: "Motor yağı ve filtre değişimi (5W-30 Long Life)" },
      { km: "60.000 km", tip: "DSG yağ + filtre değişimi" },
      { km: "90.000 km", tip: "Triger kayışı kontrolü" },
      { km: "120.000 km", tip: "Turbo hortumları + intercooler kontrol" },
    ],
    buyerAdvice: "Şehir içi kullanım yoğunsa DPF filtresi durumunu mutlaka kontrol ettirin. Uzun yol aracı olarak mükemmel performans gösterir.",
  },
  "Megane 1.5 DCI": {
    heroTitle: "Renault Megane 1.5 DCI",
    heroSubtitle: "2016–2021 · C Segment · Dizel",
    blogIntro: "Renault Megane 1.5 DCI, ekonomik dizel motoru ve şık tasarımıyla C segmentte güçlü bir alternatiftir. EDC otomatik şanzıman seçeneği konfor sağlarken, bazı kronik sorunlarıyla da bilinir.",
    specs: {
      motor: "1.5L DCI (K9K)", beygir: "110 HP", tork: "260 Nm",
      sanziman: "6 İleri EDC / Manuel", yakit: "4.3L / 100km",
      hiz: "0-100: 11.3 sn", agirlik: "1.320 kg", bagaj: "434 L"
    },
    strengths: ["Çok düşük yakıt tüketimi", "Dayanıklı K9K motor", "Uygun yedek parça fiyatları"],
    weaknesses: ["EDC şanzıman titremesi", "Debriyaj seti erken aşınması", "Elektronik arızalar"],
    maintenanceTips: [
      { km: "15.000 km", tip: "Yağ + filtre değişimi" },
      { km: "60.000 km", tip: "EDC yağ değişimi" },
      { km: "120.000 km", tip: "Debriyaj seti kontrol" },
    ],
    buyerAdvice: "EDC şanzıman tercih edecekseniz mutlaka test sürüşünde kalkış titremesini kontrol edin.",
  },
  "Talisman 1.6 DCI": {
    heroTitle: "Renault Talisman 1.6 DCI",
    heroSubtitle: "2016–2022 · D Segment · Dizel",
    blogIntro: "Renault Talisman, D segmentte konfor odaklı bir seçenek olarak öne çıkar. 1.6 DCI motor güçlü performans sunarken, enjektör sorunları dikkat edilmesi gereken bir konudur.",
    specs: {
      motor: "1.6L DCI (R9M)", beygir: "130 HP", tork: "320 Nm",
      sanziman: "6 İleri EDC", yakit: "4.5L / 100km",
      hiz: "0-100: 10.1 sn", agirlik: "1.460 kg", bagaj: "608 L"
    },
    strengths: ["Premium iç mekan kalitesi", "Geniş bagaj", "Konforlu sürüş", "Zengin donanım"],
    weaknesses: ["Enjektör seti arızası", "Yüksek bakım maliyetleri", "Düşük ikinci el değeri"],
    maintenanceTips: [
      { km: "20.000 km", tip: "Yağ + filtre değişimi" },
      { km: "100.000 km", tip: "Enjektör kontrol" },
      { km: "150.000 km", tip: "Turbo kontrol + EGR temizliği" },
    ],
    buyerAdvice: "150.000 km üstü araçlarda enjektör durumunu mutlaka kontrol ettirin. Değişim maliyeti yüksektir.",
  },
  "320i F30": {
    heroTitle: "BMW 320i F30",
    heroSubtitle: "2012–2018 · D Segment · Benzinli Turbo",
    blogIntro: "BMW 320i F30, spor sürüş dinamikleri ve premium kalitesiyle D segmentin gözdesidir. N20 motor güçlü performans sunarken, zincir gergi sorunu kritik bir güvenlik meselesidir.",
    specs: {
      motor: "2.0L N20", beygir: "184 HP", tork: "270 Nm",
      sanziman: "8 İleri ZF Otomatik", yakit: "6.1L / 100km",
      hiz: "0-100: 7.3 sn", agirlik: "1.475 kg", bagaj: "480 L"
    },
    strengths: ["Mükemmel sürüş dinamikleri", "Güçlü N20 motor", "Premium iç mekan", "8 ileri ZF şanzıman"],
    weaknesses: ["Zincir gergi mekanizması", "Yüksek bakım maliyeti", "Yağ tüketimi"],
    maintenanceTips: [
      { km: "15.000 km", tip: "Motor yağı değişimi (BMW LL-01)" },
      { km: "60.000 km", tip: "Fren balata + disk kontrolü" },
      { km: "80.000 km", tip: "Zincir gergi mekanizması kontrolü (KRİTİK)" },
      { km: "100.000 km", tip: "VANOS sistemi + su pompası" },
    ],
    buyerAdvice: "N20 motor alacaksanız zincir değişimi yapılmış mı mutlaka sorun. Yapılmamışsa pazarlıkta ₺25-40K indirim isteyin.",
  },
  "520d G30": {
    heroTitle: "BMW 520d G30",
    heroSubtitle: "2017–2022 · E Segment · Dizel",
    blogIntro: "BMW 520d G30, E segmentin en rafine dizel sedanlarından biridir. B47 motor ekonomi ve performansı birleştirir. AdBlue sistemi dikkat gerektiren başlıca konudur.",
    specs: {
      motor: "2.0L B47", beygir: "190 HP", tork: "400 Nm",
      sanziman: "8 İleri ZF Otomatik", yakit: "4.7L / 100km",
      hiz: "0-100: 7.5 sn", agirlik: "1.630 kg", bagaj: "530 L"
    },
    strengths: ["Mükemmel yakıt ekonomisi", "Üst düzey konfor", "Gelişmiş teknoloji", "Güçlü tork"],
    weaknesses: ["AdBlue dozaj ünitesi arızası", "Yüksek parça fiyatları", "Elektronik sorunlar"],
    maintenanceTips: [
      { km: "15.000 km", tip: "Yağ + filtre değişimi" },
      { km: "80.000 km", tip: "AdBlue sistem kontrolü" },
      { km: "100.000 km", tip: "Fren sistemi komple bakım" },
    ],
    buyerAdvice: "AdBlue uyarısı almış araçlardan kaçının. Yetkili servis bakım geçmişi olan araçları tercih edin.",
  },
  "Focus PowerShift": {
    heroTitle: "Ford Focus PowerShift",
    heroSubtitle: "2011–2018 · C Segment · Benzinli",
    blogIntro: "Ford Focus, C segmentin en çok satan modellerinden biridir. Ancak PowerShift (çift kavrama) şanzıman versiyonu, dünya genelinde büyük tartışmalara yol açmıştır. Titreşim ve sarsıntı sorunları nedeniyle birçok ülkede geri çağırma kampanyaları yapılmıştır.",
    specs: {
      motor: "1.6L Ti-VCT", beygir: "125 HP", tork: "159 Nm",
      sanziman: "6 İleri PowerShift DCT", yakit: "5.9L / 100km",
      hiz: "0-100: 11.9 sn", agirlik: "1.340 kg", bagaj: "363 L"
    },
    strengths: ["Dinamik sürüş karakteri", "Geniş iç hacim", "Uygun fiyat"],
    weaknesses: ["PowerShift şanzıman sorunu (kritik)", "Debriyaj erken aşınması", "Mecatronik arızaları"],
    maintenanceTips: [
      { km: "20.000 km", tip: "Yağ + filtre değişimi" },
      { km: "40.000 km", tip: "PowerShift şanzıman yağı (MUTLAKA)" },
      { km: "60.000 km", tip: "Debriyaj seti kontrol" },
    ],
    buyerAdvice: "PowerShift şanzımanlı Focus almadan önce çok düşünün. Manuel şanzıman tercih edin. Eğer alacaksanız düşük km'li ve bakımlı olmalı.",
  },
  "Corolla E210": {
    heroTitle: "Toyota Corolla E210",
    heroSubtitle: "2019–2023 · C Segment · Hibrit",
    blogIntro: "Toyota Corolla Hybrid, güvenilirlik ve yakıt ekonomisinin simgesidir. CVT şanzıman ile vınlama sesi dışında ciddi bir kronik arızası bulunmayan ender modellerdendir.",
    specs: {
      motor: "1.8L Hybrid", beygir: "122 HP (Sistem)", tork: "142 Nm",
      sanziman: "CVT (e-CVT)", yakit: "3.8L / 100km",
      hiz: "0-100: 10.9 sn", agirlik: "1.370 kg", bagaj: "361 L"
    },
    strengths: ["Üstün güvenilirlik", "Çok düşük yakıt tüketimi", "Düşük bakım maliyeti", "Yüksek ikinci el değeri"],
    weaknesses: ["CVT vınlama sesi", "Düşük performans hissi", "Bagaj hacmi (hibrit batarya)"],
    maintenanceTips: [
      { km: "15.000 km", tip: "Motor yağı değişimi" },
      { km: "40.000 km", tip: "Fren balata kontrolü" },
      { km: "100.000 km", tip: "Hibrit batarya sağlık kontrolü" },
    ],
    buyerAdvice: "En güvenilir seçeneklerden biri. CVT sesi sizi rahatsız ediyorsa alım öncesi uzun test sürüşü yapın.",
  },
  "Egea 1.3 MultiJet": {
    heroTitle: "Fiat Egea 1.3 MultiJet",
    heroSubtitle: "2015–2023 · C Segment · Dizel",
    blogIntro: "Fiat Egea, Türkiye'nin en çok satan otomobilidir. 1.3 MultiJet motor ekonomik ve dayanıklıdır ancak turbo aktuatör sorunu yaygın bir şikayettir.",
    specs: {
      motor: "1.3L MultiJet II", beygir: "95 HP", tork: "200 Nm",
      sanziman: "5 İleri Manuel", yakit: "4.1L / 100km",
      hiz: "0-100: 12.5 sn", agirlik: "1.230 kg", bagaj: "520 L"
    },
    strengths: ["Çok düşük yakıt tüketimi", "Uygun fiyat", "Geniş bagaj", "Yaygın servis ağı"],
    weaknesses: ["Turbo aktuatör arızası", "İç mekan kalitesi", "Gürültü izolasyonu"],
    maintenanceTips: [
      { km: "15.000 km", tip: "Yağ + filtre değişimi" },
      { km: "60.000 km", tip: "Triger kayışı kontrolü" },
      { km: "80.000 km", tip: "Turbo aktuatör kontrolü" },
    ],
    buyerAdvice: "80.000 km üstü araçlarda turbo aktuatör durumunu kontrol ettirin. Limp mode'a girme geçmişi olan araçlardan uzak durun.",
  },
  "Passat B8 DSG": {
    heroTitle: "Volkswagen Passat B8 DSG",
    heroSubtitle: "2015–2019 · D Segment · Benzinli",
    blogIntro: "Volkswagen Passat B8, D segmentin referans modelidir. DSG şanzıman performans ve konfor sunarken, mecatronik ünite kaynaklı sarsıntı sorunu en bilinen kronik arızasıdır.",
    specs: {
      motor: "1.4L TSI", beygir: "150 HP", tork: "250 Nm",
      sanziman: "7 İleri DSG", yakit: "5.3L / 100km",
      hiz: "0-100: 8.4 sn", agirlik: "1.430 kg", bagaj: "586 L"
    },
    strengths: ["Premium kalite hissi", "Geniş iç hacim", "Teknoloji donanımı", "Konforlu sürüş"],
    weaknesses: ["DSG sarsıntısı", "Mecatronik arızası", "Yüksek onarım maliyeti"],
    maintenanceTips: [
      { km: "15.000 km", tip: "Yağ + filtre değişimi" },
      { km: "40.000 km", tip: "DSG yağ + filtre (KRİTİK)" },
      { km: "80.000 km", tip: "Mecatronik ünite kontrol" },
    ],
    buyerAdvice: "DSG bakım geçmişi olmayan araçlardan uzak durun. 40.000 km'de DSG yağı değiştirilmemiş araçlar risklidir.",
  },
  "C180 W205": {
    heroTitle: "Mercedes C180 W205",
    heroSubtitle: "2014–2021 · D Segment · Benzinli",
    blogIntro: "Mercedes C180 W205, premium D segmentin en zarif temsilcilerinden biridir. M274 motor güvenilir performans sunarken, valf kapağı contası yağ kaçağı yaygın bir sorundur.",
    specs: {
      motor: "1.6L M274", beygir: "156 HP", tork: "250 Nm",
      sanziman: "7 İleri 7G-Tronic", yakit: "5.9L / 100km",
      hiz: "0-100: 8.2 sn", agirlik: "1.460 kg", bagaj: "480 L"
    },
    strengths: ["Premium marka değeri", "Zarif tasarım", "Konforlu sürüş", "Güvenlik donanımı"],
    weaknesses: ["Valf kapağı contası kaçağı", "Yüksek bakım maliyeti", "Yedek parça fiyatları"],
    maintenanceTips: [
      { km: "15.000 km", tip: "Yağ değişimi (MB 229.5)" },
      { km: "70.000 km", tip: "Valf kapağı contası kontrol" },
      { km: "100.000 km", tip: "Şanzıman yağı + filtre" },
    ],
    buyerAdvice: "Motor üstünde yağ izi olup olmadığını kontrol edin. Yanık kokusu varsa valf kapağı contası değişimi gerekebilir.",
  },
  "Tucson 2.0 CRDi": {
    heroTitle: "Hyundai Tucson 2.0 CRDi",
    heroSubtitle: "2015–2020 · SUV · Dizel",
    blogIntro: "Hyundai Tucson, kompakt SUV segmentinde fiyat-performans dengesiyle öne çıkar. 2.0 CRDi motor güçlü performans sunarken, DPF tıkanması şehir içi kullanımda sorun yaratabilir.",
    specs: {
      motor: "2.0L CRDi", beygir: "185 HP", tork: "400 Nm",
      sanziman: "6 İleri Otomatik", yakit: "6.4L / 100km",
      hiz: "0-100: 9.5 sn", agirlik: "1.630 kg", bagaj: "513 L"
    },
    strengths: ["Güçlü dizel motor", "Geniş iç hacim", "5 yıl garanti", "Uygun fiyat"],
    weaknesses: ["DPF filtresi tıkanması", "Şehir içi kullanımda sorunlar", "Yüksek yakıt tüketimi (şehir içi)"],
    maintenanceTips: [
      { km: "15.000 km", tip: "Yağ + filtre değişimi" },
      { km: "60.000 km", tip: "DPF filtre kontrolü" },
      { km: "100.000 km", tip: "Enjektör + turbo kontrol" },
    ],
    buyerAdvice: "Şehir içi ağırlıklı kullanılmışsa DPF durumunu mutlaka diagnostik cihazla kontrol ettirin.",
  },
  "A3 1.4 TFSI": {
    heroTitle: "Audi A3 1.4 TFSI",
    heroSubtitle: "2013–2020 · C Segment Premium · Benzinli",
    blogIntro: "Audi A3 1.4 TFSI, premium kompakt segmentin en şık seçeneklerinden biridir. EA211 motor verimli çalışırken, aşırı yağ tüketimi sorunu bilinen bir zayıf noktasıdır.",
    specs: {
      motor: "1.4L TFSI (EA211)", beygir: "150 HP", tork: "250 Nm",
      sanziman: "7 İleri S-Tronic", yakit: "5.0L / 100km",
      hiz: "0-100: 8.1 sn", agirlik: "1.290 kg", bagaj: "380 L"
    },
    strengths: ["Premium kalite", "Düşük yakıt tüketimi", "Şık tasarım", "Quattro seçeneği"],
    weaknesses: ["Aşırı yağ tüketimi", "S-Tronic bakım maliyeti", "Yüksek yedek parça fiyatları"],
    maintenanceTips: [
      { km: "15.000 km", tip: "Yağ + filtre değişimi" },
      { km: "40.000 km", tip: "S-Tronic şanzıman yağı" },
      { km: "70.000 km", tip: "Yağ tüketimi testi + piston segman kontrol" },
    ],
    buyerAdvice: "1.000 km'de 0.5L'den fazla yağ tüketiyorsa segman sorunu olabilir. Bakım defterini mutlaka inceleyin.",
  },
  "3008 EAT8": {
    heroTitle: "Peugeot 3008 EAT8",
    heroSubtitle: "2017–2022 · SUV · Benzinli",
    blogIntro: "Peugeot 3008, fütüristik iç tasarımı ve i-Cockpit konseptiyle dikkat çeker. EAT8 otomatik şanzıman pürüzsüz geçişler sunarken, düşük hızda sarsıntı sorunu bilinen bir zayıf noktasıdır.",
    specs: {
      motor: "1.6L PureTech", beygir: "180 HP", tork: "250 Nm",
      sanziman: "8 İleri EAT8", yakit: "6.2L / 100km",
      hiz: "0-100: 8.2 sn", agirlik: "1.410 kg", bagaj: "520 L"
    },
    strengths: ["Fütüristik i-Cockpit tasarımı", "Güçlü PureTech motor", "Geniş bagaj", "Zengin donanım"],
    weaknesses: ["EAT8 şanzıman sarsıntısı", "Yüksek yedek parça fiyatları", "Düşük ikinci el değeri"],
    maintenanceTips: [
      { km: "20.000 km", tip: "Yağ + filtre değişimi" },
      { km: "50.000 km", tip: "EAT8 şanzıman yazılım güncellemesi" },
      { km: "80.000 km", tip: "Triger kayışı değişimi (KRİTİK)" },
    ],
    buyerAdvice: "Şanzıman yazılımının güncellenip güncellenmediğini sorun. Güncel yazılım sarsıntıyı büyük ölçüde azaltır.",
  },
  "Duster 1.6": {
    heroTitle: "Dacia Duster 1.6",
    heroSubtitle: "2018–2023 · SUV · Benzinli",
    blogIntro: "Dacia Duster, uygun fiyatlı SUV segmentinin tartışmasız lideridir. Basit ama dayanıklı mekaniğiyle düşük bakım maliyetleri sunar. Rot başı erken aşınması en sık karşılaşılan sorunudur.",
    specs: {
      motor: "1.6L SCe", beygir: "115 HP", tork: "156 Nm",
      sanziman: "5 İleri Manuel", yakit: "7.2L / 100km",
      hiz: "0-100: 11.5 sn", agirlik: "1.300 kg", bagaj: "478 L"
    },
    strengths: ["Uygun fiyat", "Düşük bakım maliyeti", "Yüksek jip kabiliyeti", "Sade mekanik"],
    weaknesses: ["Rot başı erken aşınması", "İç mekan kalitesi", "Gürültü izolasyonu", "Yüksek yakıt tüketimi"],
    maintenanceTips: [
      { km: "15.000 km", tip: "Yağ + filtre değişimi" },
      { km: "40.000 km", tip: "Rot başı + rotil kontrol" },
      { km: "60.000 km", tip: "Amortisör kontrolü" },
    ],
    buyerAdvice: "Lastik aşınmasına bakın — düzensiz aşınma rot başı sorununa işaret eder. Direksiyon titremesi varsa kontrol ettirin.",
  },
};

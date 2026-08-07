<div align="center">

# 🛡️ InsuranceFraud**Ai**

### Sigorta hasarları için açıklanabilir, maliyet duyarlı dolandırıcılık triyajı

**Ödeme yapılmadan önce, incelenmeye değer hasarları işaretleyin.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-149ECA?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)

[English](README.md) · **Türkçe**

</div>

---

## Genel bakış

**InsuranceFraudAi**, bir Özel Araştırma Birimi (SIU) için sigorta hasarlarını triyajlayan bir karar destek aracıdır. Kara kutu bir skor yerine, her hasar için **tam olarak denetlenebilir bir karar yolu** üretir — *"İncelemeye Al"* kararına götüren kesin kural zincirini gösterir. Böylece bir analist soruşturma açma (ya da açmama) gerekçesini savunabilir, bir denetçi de mantığı baştan sona takip edebilir.

Çekirdek, TypeScript ile sıfırdan yazılmış **maliyet duyarlı bir CART karar ağacıdır**. Bilinçli olarak bir cam kutudur: dolandırıcılık kural benzeri zincirler izler (*yepyeni bir poliçe* **VE** *gece geç saatte bir olay* **VE** *polis raporu yok*) ve eksene hizalı ağaç bölünmeleri tam da bu yapıyı yakalar — bir insan araştırmacının akıl yürüttüğü gibi.

> [!NOTE]
> Bu bir **demo / portföy projesidir** ve **sentetik bir veri kümesi** üzerinde eğitilmiştir. Gerçek dolandırıcılık verileri gizlidir; bu yüzden hasarlar, belgelenmiş dolandırıcılık örüntülerinden, tohumlanmış (seeded) bir rastgele sayı üreteciyle üretilir — bu da modeli ve raporlanan her metriği her derlemede tam olarak **yeniden üretilebilir** kılar. Mühendislik, metodoloji ve metrikler gerçektir; yalnızca temel veri simüle edilmiştir. Bu bir triyaj karar destek aracıdır, otomatik bir hasar reddi sistemi değildir.

---

## Neden karar ağacı (sinir ağı değil)?

Regüle sigortacılığın, çoğu ML çalışmasının atladığı katı bir gereksinimi vardır: **her karar açıklanabilir ve savunulabilir olmalıdır.** Tüm tasarımı bu kısıt yönlendirir.

| Gereksinim | Projenin karşılama biçimi |
|---|---|
| **Denetlenebilirlik** | Her tahmin, sıralı karar yolunu döndürür — her bölünmedeki özellik, eşik ve yön — sade Türkçe/İngilizce gerekçeler halinde gösterilir. |
| **Maliyet duyarlılığı** | Bir dolandırıcılığı kaçırmak (yanlış negatif ≈ 12.000 ₺ ödeme), temiz bir hasarı incelemekten (yanlış pozitif ≈ 1.500 ₺ analist zamanı) çok daha pahalıdır. Model, doğruluğu değil, *beklenen iş maliyetini* en aza indirecek şekilde ayarlanır. |
| **Monotonluk garantileri** | Koruyucu bir sinyal — düzenlenmiş polis raporu, mevcut bir tanık, erişilebilir MOBESE/CCTV kaydı — risk skorunu **asla** artıramaz. Değer-sınırı yayılımıyla küresel olarak güvence altına alınır. |
| **Sıfır gecikmeli çıkarım** | Eğitim, derleme sırasında bir kez gerçekleşir ve statik bir JSON çıktısı üretir. Çalışma zamanındaki skorlama saf ağaç dolaşımıdır — tarayıcıda ya da uç (edge) ortamında mikrosaniyeler sürer. |

---

## Öne çıkan özellikler

### 🎯 Gerçek zamanlı hasar skorlayıcı
10 hasar değişkenini ayarlayın; model **anında ve tamamen tarayıcınızda** yeniden skorlar. Kesin karar yolunu, en etkili risk faktörlerini ve `Temiz` / `İncele` / `Yüksek` risk bandını gösterir. Bir kaydırıcı, **çalışma noktasını** taşıyarak dolandırıcılık ekibinin kesinlik (precision) ile duyarlılık (recall) arasında kendi risk iştahına göre denge kurmasını sağlar.

### 📊 Dürüst performans panoları
Eşiğe karşı kesinlik/duyarlılık, dengeli çalışma noktasında bir karışıklık matrisi ve Gini tabanlı özellik önemi — hepsi modelin eğitim sırasında **hiç görmediği ayrık bir test kümesinde** ölçülür. Kiraz toplama yok: dolandırıcılık nadirdir ve sınıflar gerçekten örtüşür, dolayısıyla ödünleşimler olduğu gibi gösterilir.

### 🔔 Poliçe yenileme hatırlatıcıları
**SMS ve WhatsApp** üzerinden (Twilio ile) yenileme bildirimleri hazırlayın ve gönderin; canlı mesaj önizlemesi, gönderim öncesi süre planlaması ve müşteri bazında yönetim içerir. Kutudan çıktığı haliyle **simülasyon modunda** çalışır — kimlik bilgisi gerektirmez — ve Twilio anahtarları ayarlandığında canlı gönderime yükseltir. Uç nokta, imzalı bir oturum çerezi ve hız sınırlama (rate limiting) ile korunur.

### 📄 Kaza raporu çözümleyici *(örnek demo)*
Kusuru bilirkişi raporu çeyrek ızgarasına (0 / 25 / 50 / 75 / 100 %) oturtan ve koşulları, bulguları ve önerileri özetleyen bir kusur değerlendirme görünümü.

### 🌍 İki dilli arayüz
Tek tıkla dil değiştirme ile tam **Türkçe 🇹🇷 / İngilizce 🇬🇧** arayüz.

---

## Model performansı

Modelin eğitim sırasında hiç görmediği, **1.500 hasarlık** ayrık bir test kümesinde ölçülmüştür (≈%12,5 dolandırıcılık taban oranı).

| Metrik | Değer | Not |
|---|---:|---|
| **ROC AUC** | **0,80** | Ayrık test kümesinde sıralama kalitesi |
| **Duyarlılık** @ maliyet-optimal (0,23) | **%78** | Maliyeti en aza indiren eşikte yakalanan tüm dolandırıcılığın payı |
| **Duyarlılık** @ dengeli F1 (0,35) | **%69** | Varsayılan çalışma noktası |
| **Kesinlik** @ dengeli F1 | %30 | %12,5 taban oranının ≈2,4 katı; tasarım gereği duyarlılık önceliklidir |
| **Ağaç** | derinlik 6 · 41 yaprak | Baştan sona okunabilecek kadar küçük |
| **Önlenen kayıp** | **≈ 316.500 ₺** | Naif 0,50 eşiğine kıyasla beklenen maliyet, test kümesinde |

> **Kesinlik neden "yalnızca" %30?** Çünkü burada *doğru* ödünleşim budur. Kaçırılan bir dolandırıcılık, bir yanlış alarmın ~8 katına mal olduğunda, maliyeti en aza indiren model bilerek daha geniş bir ağ atar — dolandırıcı bir ödemenin geçmesine izin vermektense birkaç fazladan temiz hasarı bir insana yönlendirmeyi tercih eder. Nadir ve yüksek maliyetli olaylarda doğruluk yanlış bir ölçüttür; doğru ölçüt **beklenen maliyettir** ve bu ölçütte ayarlanmış model, tasarım gereği naif 0,50 eşiğini geride bırakır.

### Modeli yönlendiren nedir

Özellik önemi (toplam safsızlık azalması), bir insan araştırmacının gerçekte nasıl triyaj yaptığıyla örtüşür:

| Sıra | Özellik | Önem |
|---|---|---:|
| 1 | Polis Raporu Düzenlendi | %21 |
| 2 | MOBESE / CCTV Kaydı | %20 |
| 3 | Eksper Şüphe Skoru | %16 |
| 4 | Olay Saati | %14 |
| 5 | Poliçe Yaşı | %13 |
| 6 | Tanık Mevcut | %11 |

---

## Nasıl çalışır?

```
              derleme zamanı                          istek zamanı
┌──────────────────────────────────────┐   ┌──────────────────────────────┐
│  data.ts    → tohumlu sentetik hasar  │   │  scoreClaim()                │
│  tree.ts    → maliyet duyarlı CART     │   │   • 10 özelliği kodla        │
│  metrics.ts → eşik taraması + maliyet  │   │   • ağacı dolaş (µs)         │
│             ↓                          │   │   • iş kuralını uygula       │
│      model.json (statik çıktı)     ───┼──▶│   • yol + risk bandı döndür   │
└──────────────────────────────────────┘   └──────────────────────────────┘
        npm run train                          tarayıcı / uç (edge) ortamı
```

1. **Sentetik veri üretimi** — özellikler gerçekçi *popülasyon* dağılımlarından çekilir, ardından elle ayarlanmış bir lojistik model, taban oranı kalibre edilmiş (~%12) şekilde dolandırıcılık log-olasılığı atar. Lojistik gürültü, gerçek bir sınıf örtüşmesi yaratır; böylece kesinlik ve duyarlılık gerçekten ödünleşir.
2. **Maliyet duyarlı CART** — hafif sınıf ağırlıklandırması `[temiz:1, dolandırıcılık:3]`, bölünme sırasında azınlık sınıfının göz ardı edilmesini engeller; ağır iş-maliyeti asimetrisi ise ayrıca **karar eşiğinde** uygulanır — Elkan teoremi uyarınca bunun ilkeli yeri orasıdır.
3. **Monotonluğun uygulanması** — özellik bazlı kısıtlar, ağaç boyunca çıktı sınırları olarak yayılır; böylece modelin sıralaması (ör. *"daha fazla kanıt ⇒ asla daha yüksek risk değil"*) yalnızca yerel değil, küresel olarak geçerlidir.
4. **Eşik ayarı** — tam bir tarama, her kesim noktasında kesinlik, duyarlılık, F1, FPR ve beklenen maliyeti hesaplar; **F1-optimal** nokta varsayılandır, **maliyet-optimal** nokta ise arayüz kaydırıcısı için yanında sunulur.
5. **Katı iş kuralı geçersiz kılması** — **tanık yok, polis raporu yok ve kamera kaydı yok** olan bir kayıp tamamen kanıtsızdır (klasik kırmızı bayrak) ve istatistiksel skordan bağımsız olarak %100 işaretlenir; bu gerekçe açıkça gösterilir.

---

## Teknoloji yığını

| Katman | Seçim |
|---|---|
| **Çatı (framework)** | Next.js 14 (App Router) |
| **Dil** | TypeScript 5.5 |
| **Arayüz** | React 18 · Tailwind CSS 3.4 · lucide-react |
| **Grafikler** | Recharts |
| **ML** | Elle yazılmış CART + maliyet duyarlı öğrenme (ML kütüphanesi yok) |
| **Bildirimler** | Twilio (SMS + WhatsApp), yerleşik bir simülasyon sağlayıcısıyla |
| **Çalışma zamanı** | Skorlama için uç (edge) · bildirimler için Node |

---

## Başlarken

**Ön koşullar:** [Node.js](https://nodejs.org) ≥ 18.17 (kontrol için `node -v`).

```bash
# 1. Bağımlılıkları yükleyin
npm install

# 2. Modeli eğitin (lib/ml/artifact/model.json üretilir)
npm run train

# 3. Geliştirme sunucusunu başlatın
npm run dev
```

[http://localhost:3000](http://localhost:3000) adresini açın.

> `npm run build`, `next build`'ten önce otomatik olarak `npm run train` çalıştırır; böylece üretim derlemeleri her zaman yeni eğitilmiş, yeniden üretilebilir bir çıktı ile gelir.

### Kullanışlı komutlar

| Komut | Yaptığı iş |
|---|---|
| `npm run dev` | Geliştirme sunucusunu `localhost:3000` üzerinde başlatır |
| `npm run build` | Modeli eğitir, ardından üretim uygulamasını derler |
| `npm start` | Üretim derlemesini sunar |
| `npm run train` | Yalnızca model çıktısını yeniden üretir |
| `npm run typecheck` | TypeScript tiplerini denetler |
| `npm run lint` | Linter'ı çalıştırır |

### İsteğe bağlı: canlı bildirimler

Bildirimler varsayılan olarak simüle edilir (gönderimler sunucu konsoluna kaydedilir ve uygulama içi bildirimler olarak gösterilir). **Gerçek** SMS / WhatsApp gönderimini etkinleştirmek için örnek env dosyasını kopyalayıp Twilio kimlik bilgilerinizi ekleyin:

```bash
cp .env.example .env.local
```

| Değişken | Amaç |
|---|---|
| `NOTIFY_MODE` | `auto` (varsayılan) · `mock` (her zaman simüle et) · `live` |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | Twilio kimlik bilgileri (tek numara hem SMS hem WhatsApp'a hizmet eder) |
| `SESSION_SECRET` | `/api/notify`'ı kötüye kullanımdan koruyan HttpOnly çerezi imzalar |
| `NOTIFY_API_KEY` | Sunucudan sunucuya çağıranlar için isteğe bağlı bearer token |
| `NOTIFY_RATE_LIMIT` / `NOTIFY_RATE_WINDOW` | Hız sınırlama (varsayılan: 60 sn'de 20 istek) |

---

## Vercel'e dağıtım

Proje, özel ayar gerektirmeden dağıtıma hazırdır.

1. Depoyu GitHub'a gönderin.
2. [vercel.com](https://vercel.com) üzerinde **Add New → Project** ile depoyu içe aktarın.
3. Vercel, Next.js'i otomatik algılar — tüm ayarları varsayılan bırakın. Derleme komutu (`npm run build`) modeli derleme zamanında eğitir ve eğitim **belirlenimcidir** (tohumlu); dolayısıyla Vercel'in modeli yereldekiyle birebir aynıdır. Demo için ortam değişkeni gerekmez.
4. **Deploy**'a tıklayın. `main`'e her gönderimde otomatik yeniden dağıtılır.

---

## Proje yapısı

```
InsuranceFraudAi/
├── app/
│   ├── page.tsx              # Açılış sayfası: skorlayıcı, panolar, özellikler
│   ├── api/score/route.ts    # Uç (edge) çıkarım uç noktası
│   └── api/notify/           # Bildirim + oturum uç noktaları (Node çalışma zamanı)
├── components/               # ClaimScorer, panolar, RenewalReminders, …
├── lib/
│   ├── ml/
│   │   ├── schema.ts         # İş gerekçeli 10 özellikli şema
│   │   ├── data.ts           # Tohumlu sentetik hasar üreteci
│   │   ├── tree.ts           # Maliyet duyarlı CART + monotonluk
│   │   ├── metrics.ts        # Eşik taraması + beklenen maliyet modeli
│   │   ├── infer.ts          # Çalışma zamanı skorlama + açıklama
│   │   └── artifact/model.json  # Eğitilmiş çıktı (scripts/train.ts ile üretilir)
│   ├── notify/               # Twilio sağlayıcıları, kimlik doğrulama, hız sınırlama
│   ├── i18n/                 # Türkçe / İngilizce çeviriler
│   └── presets.ts            # Demo için örnek hasarlar
└── scripts/train.ts          # Derleme zamanı eğitim hattı
```

---

## API

Bir hasarı programatik olarak skorlayın:

```bash
curl -X POST http://localhost:3000/api/score \
  -H "Content-Type: application/json" \
  -d '{
    "claim": {
      "policyAgeDays": 20, "claimAmount": 85000, "incidentHour": 3,
      "daysToReport": 12, "expertReportScore": 72, "priorClaims12m": 2,
      "witnessPresent": "No", "policeReportFiled": "No",
      "cctvFootage": "No", "channel": "Online"
    }
  }'
```

Dolandırıcılık olasılığını, risk bandını, tam açıklamalı karar yolunu, en etkili risk faktörlerini ve tetiklenen herhangi bir iş kuralı geçersiz kılmasını döndürür.

---

## ⚖️ Sorumluluk reddi

Bu proje, sentetik veri üzerine kurulmuş bir **teknik gösterimdir**. Üretim düzeyinde bir dolandırıcılık tespit sistemi **değildir** ve gerçek poliçe sahipleri hakkında gerçek teknik değerlendirme (underwriting), hasar veya soruşturma kararları vermek için kullanılmamalıdır. Gerçek veriler üzerinde herhangi bir dağıtım; o veride doğrulama, adillik ve önyargı denetimi, düzenleyici inceleme ve uygun insan gözetimi gerektirir. Çalışma, meşru sigortacılık, veri analitiği ve otomasyon standartlarına uygun olacak şekilde tasarlanmıştır ve eğitim ile portföy amaçlıdır.

---

<div align="center">

_Sentetik veri · Yalnızca karar desteği · Otomatik hasar reddi sistemi değildir._

</div>

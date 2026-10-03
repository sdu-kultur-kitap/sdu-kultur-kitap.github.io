const TEST_DATA = {
    questions: [
        {
            text: "Eski bir kütüphanede gizli bir kapı buldun. İçeri girdiğinde ne görüyorsun?",
            options: [
                { text: "Unutulmuş krallıkların haritaları ve büyülü objeler.", profile: { extrovert: 5, dreamer: 9, emotional: 7, rebel: 6, dark: 3 } },
                { text: "Tozlu ama çok değerli tarihi gerçekleri anlatan bilimsel belgeler.", profile: { extrovert: 5, dreamer: 2, emotional: 3, rebel: 4, dark: 2 } },
                { text: "Karanlık sırlar ve yasaklanmış kara büyü kitapları.", profile: { extrovert: 3, dreamer: 8, emotional: 5, rebel: 9, dark: 9 } },
                { text: "İçeri girmem, kurallara uyarım.", profile: { extrovert: 2, dreamer: 1, emotional: 2, rebel: 1, dark: 1 } }
            ]
        },
        {
            text: "Bir baloda herkes dans ederken sen köşede duruyorsun. Yanına biri yaklaşıp seni dansa kaldırdı. Tepkin?",
            options: [
                { text: "Coşkuyla kabul eder ve pistin yıldızı olurum.", profile: { extrovert: 10, dreamer: 6, emotional: 7, rebel: 5, dark: 2 } },
                { text: "Kibarca reddeder ve yalnızlığıma geri dönerim.", profile: { extrovert: 1, dreamer: 7, emotional: 6, rebel: 3, dark: 6 } },
                { text: "Sadece nezaket gereği kısa bir süre eşlik ederim.", profile: { extrovert: 4, dreamer: 3, emotional: 4, rebel: 2, dark: 3 } },
                { text: "Onun kim olduğunu sorgular ve mesafeli yaklaşırım.", profile: { extrovert: 3, dreamer: 4, emotional: 2, rebel: 6, dark: 7 } }
            ]
        },
        {
            text: "Büyük bir haksızlığa uğradın. İntikam planın ne olur?",
            options: [
                { text: "Zamanla adaletin yerini bulmasını beklerim.", profile: { extrovert: 4, dreamer: 6, emotional: 3, rebel: 2, dark: 1 } },
                { text: "Hemen karşı saldırıya geçer, ortalığı birbirine katarım.", profile: { extrovert: 8, dreamer: 4, emotional: 9, rebel: 9, dark: 7 } },
                { text: "Kusursuz, soğukkanlı ve yavaş bir plan yaparım.", profile: { extrovert: 3, dreamer: 5, emotional: 1, rebel: 8, dark: 9 } },
                { text: "Onları affeder ve kendi yoluma giderim.", profile: { extrovert: 5, dreamer: 8, emotional: 8, rebel: 3, dark: 0 } }
            ]
        },
        {
            text: "Bir gemi yolculuğundasın ve fırtına koptu. İlk yapacağın şey ne olur?",
            options: [
                { text: "Diğer yolculara yardım etmek için organize olmak.", profile: { extrovert: 9, dreamer: 3, emotional: 7, rebel: 3, dark: 2 } },
                { text: "Mantıklı bir kaçış planı yapıp kendimi güvenceye almak.", profile: { extrovert: 3, dreamer: 2, emotional: 1, rebel: 5, dark: 5 } },
                { text: "Fırtınanın güzelliğini ve korkutuculuğunu izlemek.", profile: { extrovert: 2, dreamer: 10, emotional: 9, rebel: 7, dark: 6 } },
                { text: "Kaptanın talimatlarını harfiyen uygulamak.", profile: { extrovert: 4, dreamer: 1, emotional: 3, rebel: 1, dark: 1 } }
            ]
        },
        {
            text: "Önünde iki yol var. Birisi karanlık bir ormana, diğeri aydınlık bir vadiye çıkıyor. Hangisi?",
            options: [
                { text: "Aydınlık vadi, huzur ve güven arıyorum.", profile: { extrovert: 6, dreamer: 5, emotional: 6, rebel: 2, dark: 1 } },
                { text: "Karanlık orman, bilinmeyenin heyecanı cezbediyor.", profile: { extrovert: 5, dreamer: 8, emotional: 7, rebel: 8, dark: 8 } },
                { text: "Haritama bakar, en mantıklı ve kısa olanı seçerim.", profile: { extrovert: 4, dreamer: 1, emotional: 2, rebel: 3, dark: 4 } },
                { text: "Kendi yeni yolumu açarım.", profile: { extrovert: 7, dreamer: 9, emotional: 5, rebel: 10, dark: 5 } }
            ]
        },
        {
            text: "İnsanlığın geleceği ellerinde, zor bir seçim yapmalısın. Mantığını mı dinlersin, kalbini mi?",
            options: [
                { text: "Kesinlikle mantık. Duygular hata yaptırır.", profile: { extrovert: 5, dreamer: 2, emotional: 1, rebel: 4, dark: 6 } },
                { text: "Kalbim. İnsanlığı insan yapan duygulardır.", profile: { extrovert: 7, dreamer: 9, emotional: 10, rebel: 5, dark: 2 } },
                { text: "Hiç kimse mükemmel değildir, iki tarafı da dinlemeye çalışırım.", profile: { extrovert: 5, dreamer: 5, emotional: 6, rebel: 4, dark: 4 } },
                { text: "İkisini de reddeder, yeni bir düzen kurarım.", profile: { extrovert: 8, dreamer: 8, emotional: 4, rebel: 10, dark: 8 } }
            ]
        },
        {
            text: "Arkadaşlarınla tartışıyorsun, olay büyüdü. Tepkin?",
            options: [
                { text: "Sesi en çok çıkan ben olurum, haklılığımı kanıtlarım.", profile: { extrovert: 9, dreamer: 3, emotional: 8, rebel: 7, dark: 5 } },
                { text: "Sessizce ortamı terk ederim.", profile: { extrovert: 1, dreamer: 6, emotional: 7, rebel: 5, dark: 6 } },
                { text: "Ortalığı sakinleştirmeye ve arabulucu olmaya çalışırım.", profile: { extrovert: 8, dreamer: 4, emotional: 6, rebel: 2, dark: 2 } },
                { text: "Mantıklı argümanlarla onları haksız olduklarına ikna ederim.", profile: { extrovert: 6, dreamer: 2, emotional: 2, rebel: 4, dark: 4 } }
            ]
        },
        {
            text: "Hayatının amacını tek kelimeyle özetlesen?",
            options: [
                { text: "Başarı.", profile: { extrovert: 8, dreamer: 3, emotional: 2, rebel: 5, dark: 6 } },
                { text: "Huzur.", profile: { extrovert: 3, dreamer: 6, emotional: 8, rebel: 2, dark: 1 } },
                { text: "Özgürlük.", profile: { extrovert: 7, dreamer: 8, emotional: 7, rebel: 10, dark: 4 } },
                { text: "Güç.", profile: { extrovert: 6, dreamer: 4, emotional: 1, rebel: 8, dark: 9 } }
            ]
        },
        {
            text: "Issız bir adaya düştün. Yanında tek bir eşya var. Nedir?",
            options: [
                { text: "Hayatta kalma rehberi.", profile: { extrovert: 4, dreamer: 1, emotional: 2, rebel: 2, dark: 3 } },
                { text: "Sevdiklerimin fotoğrafı.", profile: { extrovert: 5, dreamer: 7, emotional: 10, rebel: 3, dark: 1 } },
                { text: "İçi boş bir defter ve kalem.", profile: { extrovert: 3, dreamer: 10, emotional: 8, rebel: 6, dark: 4 } },
                { text: "Bir silah.", profile: { extrovert: 6, dreamer: 2, emotional: 1, rebel: 8, dark: 9 } }
            ]
        },
        {
            text: "Bir sırrı ne kadar iyi saklayabilirsin?",
            options: [
                { text: "Mezara kadar benimle gelir.", profile: { extrovert: 2, dreamer: 4, emotional: 4, rebel: 4, dark: 6 } },
                { text: "Sadece en yakın dostlarıma anlatabilirim.", profile: { extrovert: 8, dreamer: 5, emotional: 7, rebel: 5, dark: 3 } },
                { text: "Sır tutmak bana göre değil.", profile: { extrovert: 9, dreamer: 4, emotional: 8, rebel: 7, dark: 2 } },
                { text: "Çıkarıma uyuyorsa saklarım.", profile: { extrovert: 5, dreamer: 2, emotional: 1, rebel: 8, dark: 10 } }
            ]
        },
        {
            text: "Toplumun kuralları sana ne ifade ediyor?",
            options: [
                { text: "Hepimizi bir arada tutan gerekli sınırlar.", profile: { extrovert: 6, dreamer: 2, emotional: 3, rebel: 1, dark: 2 } },
                { text: "Yıkılmak için varlar.", profile: { extrovert: 7, dreamer: 8, emotional: 6, rebel: 10, dark: 7 } },
                { text: "Sadece benim işime yaradıkları sürece uyarım.", profile: { extrovert: 5, dreamer: 3, emotional: 2, rebel: 8, dark: 9 } },
                { text: "Bazen esnetilebilir ama genel olarak uyulmalı.", profile: { extrovert: 5, dreamer: 5, emotional: 5, rebel: 4, dark: 3 } }
            ]
        },
        {
            text: "En büyük korkun nedir?",
            options: [
                { text: "Yalnız kalmak.", profile: { extrovert: 8, dreamer: 5, emotional: 9, rebel: 3, dark: 2 } },
                { text: "Kontrolü kaybetmek.", profile: { extrovert: 4, dreamer: 2, emotional: 2, rebel: 5, dark: 8 } },
                { text: "Sıradan biri olmak.", profile: { extrovert: 7, dreamer: 9, emotional: 7, rebel: 8, dark: 5 } },
                { text: "Sevdiğim insanlara zarar gelmesi.", profile: { extrovert: 6, dreamer: 6, emotional: 10, rebel: 4, dark: 1 } }
            ]
        },
        {
            text: "Bir savaşta hangi pozisyonda olurdun?",
            options: [
                { text: "En önde savaşan cesur bir komutan.", profile: { extrovert: 9, dreamer: 3, emotional: 6, rebel: 7, dark: 4 } },
                { text: "Geride planlar yapan stratejist.", profile: { extrovert: 3, dreamer: 4, emotional: 1, rebel: 4, dark: 7 } },
                { text: "Yaralıları iyileştiren şifacı.", profile: { extrovert: 6, dreamer: 7, emotional: 10, rebel: 2, dark: 1 } },
                { text: "Savaşın anlamsızlığını savunan bir asi.", profile: { extrovert: 5, dreamer: 9, emotional: 8, rebel: 10, dark: 5 } }
            ]
        },
        {
            text: "Gece gökyüzüne baktığında ne hissedersin?",
            options: [
                { text: "Sonsuz olasılıklar ve hayaller.", profile: { extrovert: 4, dreamer: 10, emotional: 8, rebel: 6, dark: 3 } },
                { text: "Evrenin bilimsel gizemleri.", profile: { extrovert: 4, dreamer: 2, emotional: 2, rebel: 3, dark: 4 } },
                { text: "Kendi küçüklüğüm ve anlamsızlığım.", profile: { extrovert: 2, dreamer: 6, emotional: 7, rebel: 5, dark: 8 } },
                { text: "Yalnızca karanlık ve soğuk.", profile: { extrovert: 3, dreamer: 3, emotional: 3, rebel: 7, dark: 9 } }
            ]
        },
        {
            text: "Bir hazine sandığı buldun ve kilidi açtın. İçinden ne çıkmasını istersin?",
            options: [
                { text: "Sonsuz zenginlik.", profile: { extrovert: 7, dreamer: 4, emotional: 3, rebel: 6, dark: 7 } },
                { text: "Zihin okuma gücü.", profile: { extrovert: 6, dreamer: 7, emotional: 4, rebel: 8, dark: 8 } },
                { text: "Gerçek sevgi.", profile: { extrovert: 6, dreamer: 8, emotional: 10, rebel: 3, dark: 1 } },
                { text: "Geçmişteki hataları düzeltecek bir zaman makinesi.", profile: { extrovert: 4, dreamer: 9, emotional: 9, rebel: 6, dark: 5 } }
            ]
        }
    ],
    characters: [
        { name: "Raskolnikov", book: "Suç ve Ceza", traits: "Kendi doğruları uğruna radikal kararlar alabilen, içsel çatışmalarla boğuşan zeki bir genç.", keywords: ["Karmaşık", "Vicdanlı", "Asi"], profile: { extrovert: 2, dreamer: 6, emotional: 8, rebel: 9, dark: 8 } },
        { name: "Elizabeth Bennet", book: "Gurur ve Önyargı", traits: "Zeki, nüktedan, önyargılarına yenik düşebilen ancak hatasını anlayacak kadar olgun.", keywords: ["Bağımsız", "Zeki", "Gururlu"], profile: { extrovert: 7, dreamer: 4, emotional: 6, rebel: 7, dark: 2 } },
        { name: "Sherlock Holmes", book: "Sherlock Holmes", traits: "Olağanüstü gözlem yeteneği, mantığı her şeyin üstünde tutan, sosyal kurallara aldırmayan.", keywords: ["Mantıksal", "Gözlemci", "Eksantrik"], profile: { extrovert: 3, dreamer: 1, emotional: 1, rebel: 8, dark: 5 } },
        { name: "Jay Gatsby", book: "Muhteşem Gatsby", traits: "Geçmişe saplantılı, lüks içinde yaşayan ama içten içe yalnız bir hayalperest.", keywords: ["Romantik", "Takıntılı", "Hayalperest"], profile: { extrovert: 8, dreamer: 10, emotional: 8, rebel: 6, dark: 4 } },
        { name: "Jane Eyre", book: "Jane Eyre", traits: "Zorluklara boyun eğmeyen, ahlaki değerlerine sıkı sıkıya bağlı, güçlü bir irade.", keywords: ["Güçlü", "Prensipli", "Bağımsız"], profile: { extrovert: 3, dreamer: 5, emotional: 6, rebel: 5, dark: 3 } },
        { name: "Don Kişot", book: "Don Kişot", traits: "Gerçeklikten kopuk, kendi yarattığı şövalye dünyasında yaşayan idealist.", keywords: ["Hayalperest", "İdealist", "Cesur"], profile: { extrovert: 6, dreamer: 10, emotional: 8, rebel: 8, dark: 2 } },
        { name: "Frankenstein (Canavar)", book: "Frankenstein", traits: "Toplum tarafından dışlanmış, sevilmek isteyen ancak reddedildikçe karanlığa gömülen.", keywords: ["Yalnız", "Trajik", "Öfkeli"], profile: { extrovert: 2, dreamer: 5, emotional: 9, rebel: 7, dark: 9 } },
        { name: "Anna Karenina", book: "Anna Karenina", traits: "Toplum kurallarını aşkı için hiçe sayan, duygularının esiri olmuş tutkulu bir kadın.", keywords: ["Tutkulu", "Trajik", "Asi"], profile: { extrovert: 6, dreamer: 7, emotional: 10, rebel: 9, dark: 6 } },
        { name: "Meursault", book: "Yabancı", traits: "Toplumsal normlara kayıtsız, duygusuz görünen, hayatın anlamsızlığını kabullenmiş.", keywords: ["Kayıtsız", "Absürt", "Yabancı"], profile: { extrovert: 1, dreamer: 1, emotional: 1, rebel: 6, dark: 7 } },
        { name: "Harry Potter", book: "Harry Potter Serisi", traits: "Kaderin yükünü omuzlayan, sadık, cesur ve her zaman doğruyu yapmaya çalışan.", keywords: ["Cesur", "Sadık", "Seçilmiş"], profile: { extrovert: 6, dreamer: 5, emotional: 7, rebel: 6, dark: 3 } },
        { name: "Dorian Gray", book: "Dorian Gray'in Portresi", traits: "Güzellik ve zevk peşinde koşan, vicdanını yok sayan narsist.", keywords: ["Narsist", "Hedonist", "Karanlık"], profile: { extrovert: 8, dreamer: 6, emotional: 2, rebel: 8, dark: 10 } },
        { name: "Holden Caulfield", book: "Çavdar Tarlasında Çocuklar", traits: "Yetişkinlerin sahteliğinden iğrenen, yabancılaşmış ve kayıp bir genç.", keywords: ["Alaycı", "Kaygılı", "Samimi"], profile: { extrovert: 3, dreamer: 7, emotional: 8, rebel: 9, dark: 6 } },
        { name: "Jean Valjean", book: "Sefiller", traits: "Geçmişindeki hatalardan kurtulup doğru yolu bulmaya çalışan, fedakar bir baba.", keywords: ["Fedakar", "Güçlü", "Merhametli"], profile: { extrovert: 4, dreamer: 4, emotional: 8, rebel: 5, dark: 2 } },
        { name: "Moby Dick (Kaptan Ahab)", book: "Moby Dick", traits: "İntikam uğruna kendi sonunu hazırlayan, takıntılı ve inatçı.", keywords: ["İnatçı", "Takıntılı", "Yıkıcı"], profile: { extrovert: 5, dreamer: 2, emotional: 9, rebel: 7, dark: 9 } },
        { name: "Gregor Samsa", book: "Dönüşüm", traits: "Hayatını ailesine adamış ancak böceğe dönüşerek toplum dışına itilmiş.", keywords: ["Yabancılaşmış", "Fedakar", "Çaresiz"], profile: { extrovert: 1, dreamer: 4, emotional: 6, rebel: 1, dark: 5 } },
        { name: "Hermione Granger", book: "Harry Potter Serisi", traits: "Bilgiye aç, kurallara bağlı ama sevdikleri için onları çiğneyebilen, mantıklı.", keywords: ["Zeki", "Çalışkan", "Sadık"], profile: { extrovert: 6, dreamer: 3, emotional: 5, rebel: 3, dark: 1 } },
        { name: "Frodo Baggins", book: "Yüzüklerin Efendisi", traits: "İstemeden büyük bir sorumluluk yüklenen, karanlığa karşı direnen sıradan biri.", keywords: ["Cesur", "Fedakar", "Taşıyıcı"], profile: { extrovert: 4, dreamer: 6, emotional: 8, rebel: 4, dark: 4 } },
        { name: "Macbeth", book: "Macbeth", traits: "Hırsının kurbanı olan, vicdan azabıyla deliren güçlü bir savaşçı.", keywords: ["Hırslı", "Suçlu", "Trajik"], profile: { extrovert: 6, dreamer: 3, emotional: 7, rebel: 7, dark: 10 } },
        { name: "Alice", book: "Alice Harikalar Diyarında", traits: "Meraklı, hayal gücü geniş, mantıksız dünyayı anlamlandırmaya çalışan.", keywords: ["Meraklı", "Hayalperest", "Masum"], profile: { extrovert: 7, dreamer: 10, emotional: 6, rebel: 5, dark: 1 } },
        { name: "Mr. Darcy", book: "Gurur ve Önyargı", traits: "Dışarıdan soğuk ve gururlu görünen ama aslında asil ve sevecen.", keywords: ["Gururlu", "Soğuk", "Asil"], profile: { extrovert: 2, dreamer: 3, emotional: 4, rebel: 3, dark: 3 } },
        { name: "Katniss Everdeen", book: "Açlık Oyunları", traits: "Hayatta kalma içgüdüsü yüksek, ailesi için her şeyi yapabilen, istemeden asi lider olan.", keywords: ["Asi", "Cesur", "Koruyucu"], profile: { extrovert: 4, dreamer: 2, emotional: 5, rebel: 9, dark: 5 } },
        { name: "Bihter Ziyagil", book: "Aşk-ı Memnu", traits: "Aşkı ve tutkusu yüzünden kendi felaketini hazırlayan bencil ama derin karakter.", keywords: ["Tutkulu", "Hırslı", "Trajik"], profile: { extrovert: 7, dreamer: 5, emotional: 9, rebel: 8, dark: 8 } },
        { name: "Zebercet", book: "Anayurt Oteli", traits: "İçine kapanık, takıntılı ve zamanla gerçeklikle bağını koparan yalnız bir adam.", keywords: ["Yalnız", "Takıntılı", "Karanlık"], profile: { extrovert: 1, dreamer: 6, emotional: 7, rebel: 2, dark: 9 } },
        { name: "Selim Işık", book: "Tutunamayanlar", traits: "Topluma ayak uyduramayan, hassas, aydın ve hayatı anlamlandırmaya çalışan.", keywords: ["Tutunamayan", "Duygusal", "Aydın"], profile: { extrovert: 2, dreamer: 8, emotional: 9, rebel: 7, dark: 6 } },
        { name: "Küçük Prens", book: "Küçük Prens", traits: "Büyüklerin dünyasını anlamayan, kalbiyle gören ve masumiyetini koruyan.", keywords: ["Masum", "Bilge", "Hayalperest"], profile: { extrovert: 5, dreamer: 10, emotional: 10, rebel: 4, dark: 0 } },
        { name: "Hannibal Lecter", book: "Kuzuların Sessizliği", traits: "Son derece zeki, manipülatif, zarif ama korkunç derecede tehlikeli ve karanlık.", keywords: ["Zeki", "Manipülatif", "Kusursuz"], profile: { extrovert: 6, dreamer: 1, emotional: 1, rebel: 9, dark: 10 } },
        { name: "Winston Smith", book: "1984", traits: "Baskıcı bir rejime başkaldıran ama sonunda yenik düşen düşünceli adam.", keywords: ["Sorgulayan", "Çaresiz", "Asi"], profile: { extrovert: 3, dreamer: 5, emotional: 5, rebel: 8, dark: 7 } },
        { name: "Raif Efendi", book: "Kürk Mantolu Madonna", traits: "Sessiz, derinden hisseden, geçmişteki büyük aşkıyla ve hayalleriyle yaşayan naif bir ruh.", keywords: ["Sessiz", "Romantik", "İçe Dönük"], profile: { extrovert: 1, dreamer: 9, emotional: 9, rebel: 2, dark: 4 } },
        { name: "Victor Frankenstein", book: "Frankenstein", traits: "Bilgi hırsıyla tanrıcılık oynayan ve sonuçlarıyla yüzleşmekten kaçan bilim insanı.", keywords: ["Hırslı", "Korkak", "Zeki"], profile: { extrovert: 4, dreamer: 8, emotional: 3, rebel: 7, dark: 7 } },
        { name: "Oblomov", book: "Oblomov", traits: "Tembellik ve hayal kurma döngüsüne hapsolmuş, eyleme geçemeyen iyi niyetli aristokrat.", keywords: ["Tembel", "Hayalperest", "İyi Niyetli"], profile: { extrovert: 2, dreamer: 9, emotional: 6, rebel: 1, dark: 2 } }
    ]
};

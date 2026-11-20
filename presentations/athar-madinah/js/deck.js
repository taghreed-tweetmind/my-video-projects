/* deck.js — الإخراج: كل نقرة، وكل انتقال، وملاحظات المقدّمة — عرض «أثر» لمدينة تك.
   قواعد: كل الحالات الأولى بـ gsap.set هنا؛ على الخط الزمني .to و .set فقط. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var PS = window.PS || {};
  var C = { gold: [1, .74, .32, 1, .9, .62], red: [1, .25, .3, .75, .08, .15], teal: [.18, .9, .77, .45, .75, 1], white: [.95, .95, 1, .5, .85, .95], dim: [.55, .5, .6, .3, .3, .4], violet: [.55, .64, 1, .18, .9, .77], night: [.45, .6, 1, .7, .85, 1] };

  /* ---- initial state ---- */
  gsap.set('.scene', { autoAlpha: 0 });
  $$('.a').forEach(function (el) {
    if (el.classList.contains('words')) { gsap.set(el, { opacity: 1 }); gsap.set(Deck.split(el), { opacity: 0, y: 26 }); }
    else gsap.set(el, { opacity: 0, y: 36 });
  });
  gsap.set('.bg', { opacity: 0 });
  gsap.set('.face .tint', { opacity: 0 });
  gsap.set('#afOk', { opacity: 0, scale: .6 });
  Object.assign(PS, { a: 0, b: 0, mix: 1, op: .45, x: 0, scale: 1.1, burst: 0, fall: 0, size: 1, spin: .06 });
  (function (c) { PS.r1 = c[0]; PS.g1 = c[1]; PS.b1 = c[2]; PS.r2 = c[3]; PS.g2 = c[4]; PS.b2 = c[5]; })(C.teal);

  var afN = Deck.counter($('#afNum'), Deck.fmt); gsap.set(afN, { v: 2 });
  var insN = Deck.counter($('#insNum'), Deck.fmt); gsap.set(insN, { v: 0 });
  var evA = Deck.counter($('#evA'), Deck.fmt), evB = Deck.counter($('#evB'), Deck.fmt);
  gsap.set([evA, evB], { v: 0 });

  Deck.start(function (B) {
    var tl = B.tl, shapeNow = Deck.shape('dust'), sceneNow = null;

    function at() { return B.t(); }
    function reveal(sc, step, t, gap) {
      var els = $$('#' + sc + ' .a[data-step="' + step + '"]');
      els.forEach(function (el, i) {
        var p = t + i * (gap || 0.35);
        if (el.classList.contains('words')) tl.to(Deck.split(el), { opacity: 1, y: 0, duration: .55, stagger: .06, ease: 'power3.out' }, p);
        else tl.to(el, { opacity: 1, y: 0, duration: .7, ease: 'power3.out' }, p);
      });
      return t + els.length * (gap || 0.35) + .5;
    }
    function hide(sc, step, t) {
      $$('#' + sc + ' .a[data-step="' + step + '"]').forEach(function (el) {
        if (el.classList.contains('words')) tl.to(Deck.split(el), { opacity: 0, y: -16, duration: .35 }, t);
        else tl.to(el, { opacity: 0, y: -20, duration: .35 }, t);
      });
    }
    function enter(sc, t) {
      if (sceneNow) tl.to('#' + sceneNow, { autoAlpha: 0, duration: .55, ease: 'power2.in' }, t);
      tl.to('#' + sc, { autoAlpha: 1, duration: .5 }, t + (sceneNow ? .45 : 0));
      sceneNow = sc; return t + .5;
    }
    function morph(name, t, dur, extra) {
      var to = Deck.shape(name);
      tl.set(PS, { a: shapeNow, b: to, mix: 0 }, t);
      tl.to(PS, { mix: 1, duration: dur || 1.8, ease: 'none' }, t);
      if (extra) tl.to(PS, Object.assign({ duration: dur || 1.8, ease: 'power2.inOut' }, extra), t);
      shapeNow = to;
    }
    function color(name, t, dur) { var c = C[name]; tl.to(PS, { r1: c[0], g1: c[1], b1: c[2], r2: c[3], g2: c[4], b2: c[5], duration: dur || 1.2 }, t); }
    function bg(name, t, dur) { ['Warm', 'Red', 'Teal', 'Night'].forEach(function (n) { tl.to('#bg' + n, { opacity: n === name ? 1 : 0, duration: dur || 1.2 }, t); }); }
    function shake(sel, t) { tl.to(sel, { keyframes: [{ x: -14 }, { x: 12 }, { x: -9 }, { x: 6 }, { x: -3 }, { x: 0 }], duration: .45, ease: 'none' }, t); }

    var s;
    /* ======================= الغلاف ======================= */
    B.scene('الغلاف');
    s = at(); enter('s-cover', s); bg('Teal', s, 1.4); color('teal', s, 1.2);
    morph('pin', s, 2, { op: .6, x: -.5, scale: .9, size: 1, tilt: .2 }); reveal('s-cover', 1, s + .5);
    B.beat('الغلاف', 'السلام عليكم. أنا تغريد الغانمي، فريق Tweet mind. هذا «أثر — ذاكرة المدينة»، في مسار المدن الذكية والحياة الحضرية، لتحدي «رقابة حضرية مستمرة»، ويخدم معه تحدي «مواطن واحد — رحلة واحدة». خلوني أبدأ بقصة. — 10 ثوانٍ');

    /* ======================= القصة ======================= */
    B.scene('أبو فهد');
    s = at(); enter('s-af', s); bg('Night', s, 1.6); color('night', s);
    morph('road', s, 2.2, { op: 1, x: -0.45, scale: 1.15, lock: 1, rot: 0.3, tilt: .6 });
    reveal('s-af', 1, s + .5);
    B.beat('أبو فهد: الحفرة', 'هذا أبو فهد، ساكن في أحد أحياء المدينة المنورة. يمر كل يوم من نفس الشارع… وفيه حفرة. — 7 ثوانٍ');

    s = at(); reveal('s-af', 2, s);
    tl.to('#afOk', { opacity: 1, scale: 1, duration: .5, ease: 'back.out(2)' }, s + 1.1);
    color('teal', s + 1.1, .6);
    tl.to(PS, { burst: .12, duration: .4 }, s + 1.1); tl.to(PS, { burst: 0, duration: .9 }, s + 1.5);
    B.beat('أبو فهد: انقفل البلاغ', 'رفع بلاغ… وبعد أيام جته رسالة: تم إغلاق البلاغ. — 5 ثوانٍ');

    s = at(); reveal('s-af', 3, s, .8);
    color('red', s + .3, .6); bg('Red', s + .3, .9); morph('crash', s + .2, 1.6, { lock: 0, spin: .03, tilt: .25 });
    shake('#s-af', s + .6);
    B.beat('أبو فهد: رجعت', '(بطء) بعد ثلاث أسابيع… نفس الحفرة رجعت. ورفع بلاغ جديد — برقم جديد، من الصفر. كأن المدينة ما شافت الموقع قبل. — 8 ثوانٍ');

    s = at(); hide('s-af', 2, s); hide('s-af', 3, s); reveal('s-af', 4, s + .4, .8);
    tl.to(afN, { v: 5, duration: 1.6, ease: 'power1.inOut' }, s + .7);
    morph('reports', s + .3, 1.8, { lock: 1, rot: 0, tilt: .1 });
    tl.to('#s-af .tint', { opacity: .7, duration: 1.2 }, s + 1.6);
    B.beat('أبو فهد: خمس بلاغات', 'وجيرانه رفعوا بعد… خمس بلاغات عن نفس الحفرة. على الورق: كلها منجزة. في الشارع: حفرة وحدة… ما انحلّت. — 8 ثوانٍ');

    B.scene('أم ريان');
    s = at(); enter('s-ur', s); tl.to(PS, { lock: 0, duration: .8 }, s); bg('Night', s + .4, 1.2); color('violet', s + .4);
    morph('people', s + .3, 1.8, { op: .9, tilt: .25 }); reveal('s-ur', 1, s + .8);
    B.beat('أم ريان: ما رجع لي أحد', 'أم ريان، جارته: رفعت بلاغ… وانقفل، وما أحد رجع لي. — 5 ثوانٍ');

    s = at(); reveal('s-ur', 2, s, .7); morph('question', s + .2, 1.6); color('gold', s + .2, .8);
    B.beat('أم ريان: على الورق؟', 'انحلّت فعلًا؟ ولا انقفلت على الورق؟ ما فيه شي تشوفه، ولا مكان تقول فيه: ما زالت موجودة. — 7 ثوانٍ');

    B.scene('فريق الصيانة');
    s = at(); enter('s-ins', s); bg('Warm', s + .4, 1.2); color('gold', s + .4);
    morph('city', s + .3, 2, { op: .9, tilt: .5, spin: .05, scale: 1 }); reveal('s-ins', 1, s + .8);
    tl.to(insN, { v: 3836, duration: 2, ease: 'power2.out' }, s + 1.2);
    B.beat('فريق الصيانة: حجم الشغل', 'وفي الجهة الثانية فريق الصيانة في الأمانة. الشغل كبير: في أسبوع واحد عالجت أمانة المدينة 3,836 متر مربع من الحفر والهبوطات — حسب صحيفة المدينة، يوليو 2024. — 8 ثوانٍ');

    s = at(); reveal('s-ins', 2, s, .8); morph('loop', s + .2, 1.8, { tilt: .15 }); color('red', s + 1.2, .6);
    B.beat('فريق الصيانة: كأنها أول مرة', 'يصلح نفس الموقع مرة… ومرتين… وكل مرة كأنها أول مرة — ما فيه شي يقول له: هذا الموقع انصلح قبل. — 7 ثوانٍ');

    B.scene('الفجوة');
    s = at(); enter('s-gap', s); bg('', s, 1.4); color('dim', s, 1.4);
    tl.to(PS, { op: .55, duration: 1.4 }, s); reveal('s-gap', 1, s + .7, .7);
    B.beat('الفجوة', '(وقفة) ما أحد فيهم مقصّر. البلاغ ينقفل… والمدينة تنسى الموقع. — 6 ثوانٍ');

    /* ======================= التحدي ثم أثر ======================= */
    B.scene('التحدي');
    s = at(); enter('s-chal', s); color('white', s, 1.4); morph('eye', s, 2, { op: .9, tilt: .1 });
    reveal('s-chal', 1, s + .6, .6);
    B.beat('سؤال التحدي', 'وهذا بالضبط تحدي «رقابة حضرية مستمرة» في مدينة تك: كيف نرصد حالة المدينة في الميدان بشكل دائم، بدون ما نزيد المفتشين بنفس النسبة؟ — 8 ثوانٍ');

    B.scene('أثر');
    s = at(); enter('s-reveal', s); bg('Teal', s, 1.6); color('teal', s, 1.4);
    morph('merge', s, 2.2, { op: 1, size: 1.1, tilt: .1 });
    tl.to(PS, { burst: .25, duration: .35 }, s + .2); tl.to(PS, { burst: 0, duration: 1.4 }, s + .55);
    reveal('s-reveal', 1, s + .8, .6);
    B.beat('أثر', '(ابتسمي) فبنينا أثر: المجتمع يرصد، والجهة تُصلح، وأثر يتذكّر. — 5 ثوانٍ');

    /* ======================= الأقسام ======================= */
    B.scene('المشكلة');
    s = at(); enter('s-problem', s); color('gold', s); morph('city', s, 1.8, { op: .3, x: 0, scale: 1.3, tilt: .5 }); reveal('s-problem', 1, s + .5, .6);
    B.beat('المشكلة', 'المؤشر المعلن اليوم: كم بلاغ أُنجز، مو هل صمد الإصلاح. أمانة المدينة عالجت 3,836 م² حفر في أسبوع. وأمانة العاصمة المقدسة استقبلت 44,418 بلاغ في 4 أشهر والمعلن نسبة الإنجاز 81%. لكن نسبة رجوع المشكلة بعد الإغلاق؟ ما لقينا لها رقم منشور — وهذي الفجوة. — 18 ثانية');

    B.scene('الموجود اليوم');
    s = at(); enter('s-exist', s); color('violet', s); morph('network', s, 1.8, { op: .22, x: 0, scale: 1.3, tilt: .25 }); reveal('s-exist', 1, s + .5, .4);
    B.beat('الموجود: محليًا وعالميًا', 'بحثنا محليًا وعالميًا: بلدي و940 عندنا، ومبادرة الراصد المعتمد من وزارة البلديات اللي تخلّي المجتمع يرصد المخالفات، FixMyStreet في بريطانيا، SeeClickFix في أمريكا، 12345 في بكين، وvialytics في ألمانيا وMy City Report في اليابان. فيه من يدمج المكرر، وفيه من يسأل المبلّغ انصلحت؟ لكن ما أحد يقارن البلاغ الجديد بالمغلق في نفس الموقع ويقول: هذي رجعت بعد إصلاح. — 18 ثانية');

    s = at(); hide('s-exist', 1, s); reveal('s-exist', 2, s + .45, .35); color('teal', s, 1);
    B.beat('الموجود: وش يضيف أثر', 'أثر يضيف اللي ناقص: ذاكرة للموقع تقارن بالمغلق مو بالمفتوح بس، ولا إغلاق بلا دليل، واستباقي بلا أجهزة، وطبقة مكمّلة لبلدي والقرار للجهة. — 12 ثانية');

    B.scene('الدليل');
    s = at(); enter('s-evidence', s); color('teal', s); morph('shield', s, 1.8, { op: .25, x: -.55, scale: 1.1 });
    reveal('s-evidence', 1, s + .5, .4);
    tl.to(evA, { v: 132, duration: 1.4, ease: 'power2.out' }, s + .6);
    tl.to(evB, { v: 58, duration: 1.4, ease: 'power2.out' }, s + .6);
    B.beat('الدليل: الاختبارات', '132 اختبار آلي كلها ناجحة — أعدنا تشغيلها اليوم. و58 سيناريو قبول بأدوار منفصلة: 53 ناجح، 4 جزئي، وصفر فاشل. ومسارات الذاكرة والتنبيه الاستباقي: 6 من 7 نجحت بالتشغيل الفعلي. — 12 ثانية');

    s = at(); hide('s-evidence', 1, s); reveal('s-evidence', 2, s + .45);
    B.beat('الدليل: صوت الناس', 'وصوت الناس: مراجعة لتطبيق بلدي تقول إن البلاغات ما يمكن متابعتها وتنقفل بدون ما يرجعون لصاحبها. وسكان حي الياقوت: التجاوب سريع لكن المشهد يتكرر كل أسبوع. ومقال في عكاظ عن طرق تهبط بعد صيانتها. العيّنة صغيرة — والمقابلات المباشرة أول خطوة في التجربة. — 15 ثانية');

    B.scene('النموذج الأولي');
    s = at(); enter('s-proto', s); tl.to(PS, { op: .12, duration: 1 }, s); morph('phone', s, 1.6, { x: .5, scale: 1, lock: 1, rot: 0.3 });
    reveal('s-proto', 1, s + .5, .35);
    B.beat('النموذج الأولي', 'النموذج يشتغل. المواطن يصوّر ويحدد الموقع، فيشوف: هذه المشكلة معروفة، ورقم القضية — بدل بلاغ مكرر. لا إغلاق بلا دليل: صورة بعد الإصلاح يعتمدها مراجع الجودة. ولو رجعت، تنسجل عودة بعد إصلاح، وينبّه للفحص قبل الموعد المتوقع بسبعة أيام. — 15 ثانية');

    B.scene('إثبات المفهوم');
    s = at(); enter('s-poc', s); morph('pin', s, 1.8, { op: .22, x: 0, scale: 1.2, lock: 0, rot: 0 }); reveal('s-poc', 1, s + .5, .5);
    B.beat('إثبات المفهوم', 'أصعب افتراض: نربط الرصد بتاريخ الموقع الصحيح بدون ما ندمج مشكلتين مختلفتين. رصد على بعد 7 أمتار انضم لنفس القضية، ودقة ±35 متر راحت لمراجعة بشرية، وقضية انقفلت بدون تحقق انفتحت تلقائيًا. وبصراحة: البيانات تجريبية، والدخول تجريبي، والمسافات تُعاير في الميدان. — 15 ثانية');

    B.scene('شاهد التجربة');
    s = at(); enter('s-demo', s); color('teal', s); morph('road', s, 1.6, { op: .9, x: -.45, scale: 1.15, lock: 1, rot: 0.3, tilt: .6 }); reveal('s-demo', 1, s + .5, .4);
    B.beat('شاهد التجربة', 'التجربة كاملة في الفيديو — امسحوا الكود. نفس الحفرة، لكن مع أثر. — 5 ثوانٍ');

    B.scene('بعد أثر');
    s = at(); enter('s-after', s); bg('Teal', s, 1.2); morph('check', s, 1.8, { lock: 0, rot: 0, op: .25, x: -.6, scale: .8, tilt: .1 }); reveal('s-after', 1, s + .5, .6);
    B.beat('نرجع لهم مع أثر', 'نرجع لهم: أبو فهد ما يرفع بلاغ جديد — أثر يقول له هذه المشكلة معروفة، ولأنها رجعت بعد إصلاح تنفتح وتنحسب عودة. أم ريان تشوف وين وصلت القضية وصورة الإصلاح، وتقول تحسّن أو ما زال. وفريق الصيانة ينبّهه أثر يفحص الموقع قبل موعد رجوعه المتوقع. — 15 ثانية');

    B.scene('تحديات المدينة');
    s = at(); enter('s-fit', s); bg('Night', s, 1.2); color('night', s); morph('eye', s, 1.8, { op: .2, x: 0, scale: 1.4 }); reveal('s-fit', 1, s + .5, .5);
    B.beat('وين يركب أثر', 'أثر يركب على ثلاث تحديات: رقابة حضرية مستمرة — المجتمع عين دائمة والفحص يروح للموقع اللي حان وقته بدون زيادة مفتشين. مواطن واحد رحلة واحدة — قضية وحدة بدل خمس بلاغات. وبلدية تعمل بسلاسة — طبقة فوق بلدي و940 بقواعد واضحة وتقنيات مفتوحة. وما يحتاج أجهزة. — 15 ثانية');

    B.scene('خريطة الربط');
    s = at(); enter('s-map', s); bg('', s, 1); color('teal', s); morph('network', s, 1.8, { op: .25, x: 0, scale: 1.3 }); reveal('s-map', 1, s + .5);
    B.beat('خريطة الربط', 'المثبت: الربط ومنع التكرار، وكشف الرجوع، ولا إغلاق بلا دليل، والفحص الوقائي. اللي ما اختبرناه: هل المسافات تناسب شوارع المدينة، وهل السجل التاريخي يكفي. والخطوة التالية: قراءة البلاغات من بلدي أو 940، وتجربة في حي واحد لثلاث أشهر. — 12 ثانية');

    B.scene('مسار التنفيذ');
    s = at(); enter('s-path', s); color('violet', s); morph('city', s, 1.8, { op: .22, x: 0, scale: 1.3, tilt: .5 }); reveal('s-path', 1, s + .5, .4);
    B.beat('مسار التنفيذ', 'من يتبنّاه: أمانة منطقة المدينة المنورة — صيانة الطرق ومركز 940 — عبر التجربة الميدانية في مدينة تك. نحتاج سجل بلاغات تاريخي لحي تجريبي، وتجربة مع فرق الصيانة، وربط ببلدي أو 940. والتكلفة تتحسب بالريال بعد ما نعرف بيئة الأمانة التقنية. والاستمرار: خدمة سنوية، والعائد ينقاس بانخفاض الإصلاح المتكرر. — 15 ثانية');

    B.scene('الأثر');
    s = at(); enter('s-impact', s); color('gold', s); morph('rise', s, 1.8, { op: .12, x: -.6, scale: .9 }); reveal('s-impact', 1, s + .5, .5);
    B.beat('الأثر', 'وش نقيس في التجربة: نسبة رجوع المشكلة قبل وبعد — الرقم اللي ما يُنشر اليوم. وكم بلاغ انضم لقضية قائمة — في بياناتنا التجريبية 10 من 22. وكم موقع انفحص قبل ما يرجع. ويرتبط بالهدفين 11 و9 من أهداف التنمية المستدامة وبرنامج جودة الحياة. — 15 ثانية');

    B.scene('الخلاصة');
    s = at(); enter('s-sum', s); bg('Teal', s, 1.4); color('teal', s); morph('merge', s, 1.8, { op: .45, x: -.5, scale: 1 }); reveal('s-sum', 1, s + .5, .9);
    B.beat('الخلاصة', 'البلاغ ينقفل والمشكلة ترجع، وما أحد يربطها بتاريخها. أثر ذاكرة لكل موقع، يتحقق إن الإصلاح صمد وينبّه قبل الرجوع — ونموذجه يشتغل. ونطلب تجربة ميدانية في حي واحد بالمدينة المنورة لثلاث أشهر. — 12 ثانية');

    s = at(); hide('s-sum', 1, s); reveal('s-sum', 2, s + .4, .8); tl.to(PS, { op: 1, duration: 1.2 }, s);
    B.beat('ما نبي نعرف بس…', '(بهدوء) ما نبي نعرف بس كم بلاغ انقفل… نبي نعرف كم مشكلة انحلّت فعلًا وما رجعت. شكرًا. — 6 ثوانٍ');
  });
})();

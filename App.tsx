
import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from './components/Layout.tsx';
import { Step, ProjectIdea, ProjectProposal, BudgetItem } from './types.ts';
import { generateProjectIdeas, generateFullProposal, getApiKey } from './services/geminiService.ts';
import * as docx from "docx";
import FileSaver from "file-saver";
import * as XLSX from "xlsx";

interface EditableBudgetItem extends BudgetItem {
  originalIndex: number;
}

type Lang = 'ar' | 'en';

const App: React.FC = () => {
  const [lang, setLang] = useState<Lang>('ar');
  const [step, setStep] = useState<Step>(Step.Input);
  const [activeTab, setActiveTab] = useState<'narrative' | 'financial'>('narrative');
  const [vision, setVision] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [ideas, setIdeas] = useState<ProjectIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<ProjectIdea | null>(null);
  const [proposal, setProposal] = useState<ProjectProposal | null>(null);
  const [hasKey, setHasKey] = useState<boolean>(true);

  const [customCategories, setCustomCategories] = useState<string[]>([]);

  useEffect(() => {
    try {
      const key = getApiKey();
      setHasKey(!!key);
    } catch (e) {
      setHasKey(false);
    }
  }, []);

  const t = {
    ar: {
      welcome: "أهلاً بك في آداة أثر الذكية",
      subWelcome: "حوّل رؤيتك التنموية إلى مقترحات عالمية المستوى في ثوانٍ.",
      targetTitle: "🎯 الهدف من المنصة",
      targetDesc: "منصة ويب إنسانية تساعد المنظمات غير الحكومية على تخطيط مشاريعها، كتابة مقترحات احترافية، وقياس الأثر بطريقة بسيطة وذكية.",
      country: "الدولة المستهدفة",
      vision: "رؤية/وصف المشروع",
      start: "بدء التحليل الاستراتيجي",
      loadingContext: "جاري تحليل السياق التنموي...",
      loadingProposal: "جاري صياغة المقترح والميزانية التفصيلية...",
      ideasTitle: "الخيارات الاستراتيجية المقترحة",
      select: "اختيار وتطوير المقترح ←",
      narrative: "المقترح الفني",
      financial: "الميزانية (Excel)",
      downloadWord: "تحميل Word",
      downloadExcel: "تحميل Excel",
      execSummary: "الملخص التنفيذي",
      probAnalysis: "تحليل المشكلة ونظرية التغيير",
      budgetEdit: "تحرير ميزانية المشروع",
      total: "إجمالي الميزانية",
      meTitle: "خطة المراقبة والتقييم (M&E)",
      swotTitle: "تحليل SWOT المعمق",
      activitiesTitle: "مصفوفة الأنشطة",
      item: "البند",
      cost: "الكلفة الشهرية",
      qty: "الكمية",
      freq: "التكرار",
      grandTotal: "المجموع الكلي",
      back: "عودة",
      lang: "EN",
      toc: "نظرية التغيير",
      goals: "الأهداف المحددة (SMART)",
      sustainability: "الاستدامة والخروج",
      setupRequired: "مطلوب إعداد مفتاح الـ API",
      setupDesc: "للبدء في استخدام المنصة على Cloudflare Pages، يجب إضافة المفتاح في الإعدادات.",
      setupStep1: "1. ادخل على مشروعك في Cloudflare Pages.",
      setupStep2: "2. اضغط على تبويب Settings في الأعلى.",
      setupStep3: "3. اختر Environment variables من القائمة اليسرى.",
      setupStep4: "4. اضغط Add Variable تحت قسم Production وأضف VITE_API_KEY.",
      setupStep5: "5. هام: اذهب لتبويب Deployments واضغط Retry Deployment ليتفعل المفتاح."
    },
    en: {
      welcome: "Welcome to ATHAR Architect",
      subWelcome: "Transform your development vision into world-class proposals in seconds.",
      targetTitle: "🎯 Platform Goal",
      targetDesc: "A humanitarian web platform that helps NGOs plan their projects, write professional proposals, and measure impact in a simple and smart way.",
      country: "Target Country",
      vision: "Project Vision/Description",
      start: "Start Strategic Analysis",
      loadingContext: "Analyzing development context...",
      loadingProposal: "Drafting technical proposal and budget...",
      ideasTitle: "Proposed Strategic Options",
      select: "Select & Develop Proposal ←",
      narrative: "Technical Proposal",
      financial: "Financial Budget (Excel)",
      downloadWord: "Download Word",
      downloadExcel: "Download Excel",
      execSummary: "Executive Summary",
      probAnalysis: "Problem Analysis & Theory of Change",
      budgetEdit: "Edit Project Budget",
      total: "Total Budget",
      meTitle: "Monitoring & Evaluation (M&E) Plan",
      swotTitle: "In-depth SWOT Analysis",
      activitiesTitle: "Activity Matrix",
      item: "Item",
      cost: "Monthly Cost",
      qty: "Quantity",
      freq: "Frequency",
      grandTotal: "Grand Total",
      back: "Back",
      lang: "عربي",
      toc: "Theory of Change",
      goals: "Specific SMART Goals",
      sustainability: "Sustainability & Exit Strategy",
      setupRequired: "API Key Required",
      setupDesc: "To use the platform on Cloudflare Pages, you must add the key in settings.",
      setupStep1: "1. Go to your Cloudflare Pages project.",
      setupStep2: "2. Click the 'Settings' tab at the top.",
      setupStep3: "3. Select 'Environment variables' from left menu.",
      setupStep4: "4. Click 'Add Variable' in Production and add VITE_API_KEY.",
      setupStep5: "5. Important: Go to 'Deployments' and click 'Retry Deployment'."
    }
  }[lang];

  useEffect(() => {
    document.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasKey) {
      alert(t.setupRequired);
      return;
    }
    setLoading(true);
    setLoadingMessage(t.loadingContext);
    try {
      const suggestedIdeas = await generateProjectIdeas(vision, country, lang);
      setIdeas(suggestedIdeas);
      setStep(Step.Ideas);
    } catch (error) { alert(lang === 'ar' ? 'خطأ في الاتصال بمحرك الذكاء الاصطناعي' : 'AI Engine Connection Error'); }
    finally { setLoading(false); }
  };

  const handleSelectIdea = async (idea: ProjectIdea) => {
    setSelectedIdea(idea);
    setLoading(true);
    setLoadingMessage(t.loadingProposal);
    try {
      const fullProposal = await generateFullProposal(idea, country, lang, customCategories);
      setProposal(fullProposal);
      setStep(Step.Proposal);
    } catch (error) { alert(lang === 'ar' ? 'خطأ في صياغة المقترح' : 'Drafting Error'); }
    finally { setLoading(false); }
  };

  const downloadWord = async () => {
    if (!proposal) return;
    const { Document, Packer, Paragraph, HeadingLevel, AlignmentType, TextRun, Table, TableRow, TableCell, WidthType } = docx;
    const isRtl = lang === 'ar';
    const align = isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT;

    const createHeading = (text: string, level: any) => new Paragraph({
      children: [new TextRun({ text, bold: true, size: level === HeadingLevel.HEADING_1 ? 36 : 28, color: "1E1B4B" })],
      heading: level,
      alignment: align,
      bidirectional: isRtl,
      spacing: { before: 400, after: 200 }
    });

    const createText = (text: string) => new Paragraph({
      children: [new TextRun({ text, size: 24 })],
      alignment: AlignmentType.JUSTIFIED,
      bidirectional: isRtl,
      spacing: { after: 200 }
    });

    const children: any[] = [
      new Paragraph({
        children: [new TextRun({ text: proposal.title, bold: true, size: 48, color: "1E1B4B" })],
        alignment: AlignmentType.CENTER,
        bidirectional: isRtl,
        spacing: { after: 800 }
      }),
      createHeading(`1. ${t.execSummary}`, HeadingLevel.HEADING_2),
      createText(proposal.executiveSummary),
      createHeading(`2. ${t.probAnalysis}`, HeadingLevel.HEADING_2),
      createText(proposal.problemAnalysis || ""),
      createHeading(`3. ${t.toc}`, HeadingLevel.HEADING_2),
      createText(proposal.theoryOfChange || ""),
      createHeading(`4. ${t.goals}`, HeadingLevel.HEADING_2),
      ...(proposal.specificGoals?.map(goal => new Paragraph({
        children: [new TextRun({ text: `• ${goal}`, size: 24 })],
        alignment: align,
        bidirectional: isRtl,
        spacing: { after: 120 }
      })) || []),
      createHeading(`5. ${t.swotTitle}`, HeadingLevel.HEADING_2),
      createText(proposal.swot?.strengths?.join(", ") || ""),
      createHeading(`6. ${t.activitiesTitle}`, HeadingLevel.HEADING_2),
    ];

    const tableHeader = (text: string) => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF" })], alignment: AlignmentType.CENTER, bidirectional: isRtl })],
      shading: { fill: "1E1B4B" }
    });

    const activityTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            tableHeader(lang === 'ar' ? 'النشاط' : 'Activity'),
            tableHeader(lang === 'ar' ? 'التفاصيل' : 'Details'),
            tableHeader(lang === 'ar' ? 'المخرج' : 'Output'),
          ]
        }),
        ...(proposal.activities?.map(a => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.activity, size: 20 })], bidirectional: isRtl })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.details, size: 20 })], bidirectional: isRtl })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.output, size: 20 })], bidirectional: isRtl })] }),
          ]
        })) || [])
      ]
    });

    children.push(activityTable);
    children.push(createHeading(`7. ${t.meTitle}`, HeadingLevel.HEADING_2));
    children.push(createText(proposal.mePlan?.indicators?.join(" | ") || ""));

    const doc = new Document({
      sections: [{
        properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        children: children
      }]
    });

    const blob = await Packer.toBlob(doc);
    FileSaver.saveAs(blob, `ATHAR_Proposal_${proposal.title.substring(0, 30).replace(/\s+/g, '_')}.docx`);
  };

  const downloadExcel = () => {
    if (!proposal) return;
    const rows: any[][] = [
      [proposal.title, "", "", "", "", "", "", "", "", ""],
      [lang === 'ar' ? "رمز الموازنة" : "Budget Code", lang === 'ar' ? "العنصر" : "Item", lang === 'ar' ? "الكلفة الشهرية" : "Monthly Cost", "Allocation", "Qty", "Unit", "Freq", "Freq Unit", "Total", "Narrative"],
    ];
    proposal.budget.forEach(i => rows.push([i.budgetCode || "", i.item, i.monthlyCost, i.allocation, i.quantity, i.unit, i.frequency, i.frequencyUnit, i.total, i.description]));
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Budget");
    XLSX.writeFile(workbook, `ATHAR_Budget_${proposal.title.substring(0, 15)}.xlsx`);
  };

  if (!hasKey) {
    const [inputKey, setInputKey] = useState('');

    const handleSaveKey = () => {
      if (inputKey.trim().length > 10) {
        localStorage.setItem('ATHAR_API_KEY', inputKey.trim());
        setHasKey(true);
        window.location.reload();
      } else {
        alert(lang === 'ar' ? 'يرجى إدخال مفتاح صحيح' : 'Please enter a valid key');
      }
    };

    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-20 px-6">
          <div className="glass-card rounded-[3rem] p-12 md:p-20 border-t-8 border-[#B4975A] shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-10 border-2 border-red-100">
                <span className="text-4xl">🔑</span>
              </div>
              <h2 className="text-4xl font-black text-[#1E1B4B] mb-6">{t.setupRequired}</h2>

              <div className="w-full max-w-md mb-12">
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder={lang === 'ar' ? "أدخل مفتاح الـ API هنا..." : "Enter API Key here..."}
                  className="w-full px-6 py-4 rounded-xl border-2 border-slate-200 focus:border-[#B4975A] outline-none mb-4 font-mono text-center"
                />
                <button
                  onClick={handleSaveKey}
                  className="w-full bg-[#B4975A] text-white py-4 rounded-xl font-black shadow-lg hover:brightness-110 mb-4"
                >
                  حفظ المفتاح ومتابعة ✅
                </button>
              </div>

              <p className="text-slate-500 text-sm font-bold mb-8 max-w-xl">{t.setupDesc}</p>

              <div className="w-full text-right space-y-4 bg-slate-50 p-8 rounded-[2rem] border border-slate-200 text-sm">
                <p className="font-black text-[#1E1B4B] flex items-center gap-3">
                  <span className="bg-[#B4975A] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                  {t.setupStep1}
                </p>
                <p className="font-black text-[#1E1B4B] flex items-center gap-3">
                  <span className="bg-[#B4975A] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                  {t.setupStep2}
                </p>
                <p className="font-black text-[#1E1B4B] flex items-center gap-3 text-xs opacity-70">
                  {t.setupStep3} (VITE_API_KEY)
                </p>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="mt-12 text-[#1E1B4B] font-black underline"
              >
                تحديث الصفحة ↻
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }


  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-40">
          <div className="w-24 h-24 border-8 border-indigo-100 border-t-[#B4975A] rounded-full animate-spin mb-10"></div>
          <p className="text-indigo-950 font-black text-2xl animate-pulse text-center">{loadingMessage}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex justify-end mb-6 no-print">
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="bg-white/90 backdrop-blur px-8 py-3 rounded-2xl shadow-md border border-[#B4975A]/20 font-black text-[#1E1B4B] hover:bg-[#B4975A] hover:text-white transition-all transform hover:scale-105 active:scale-95"
          >
            {t.lang}
          </button>
        </div>

        {step === Step.Input && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <div className="glass-card rounded-[4rem] p-10 md:p-20 shadow-3xl border-t-8 border-t-[#B4975A] relative overflow-hidden">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-5xl font-black text-[#1E1B4B] mb-4 tracking-tight">{t.welcome}</h2>
                <p className="text-slate-500 font-bold mb-16 text-xl">{t.subWelcome}</p>
              </div>

              <form onSubmit={handleStartAnalysis} className="space-y-12 max-w-4xl mx-auto">
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t.country}</label>
                    <input type="text" required value={country} onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-8 py-6 rounded-[2rem] bg-white border-2 border-slate-100 outline-none font-black text-[#1E1B4B] shadow-inner focus:border-[#B4975A] transition-all"
                      placeholder={lang === 'ar' ? "مثلاً: اليمن، سوريا..." : "e.g. Yemen, Sudan..."} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t.vision}</label>
                    <input type="text" required value={vision} onChange={(e) => setVision(e.target.value)}
                      className="w-full px-8 py-6 rounded-[2rem] bg-white border-2 border-slate-100 outline-none font-black text-[#1E1B4B] shadow-inner focus:border-[#B4975A] transition-all"
                      placeholder={lang === 'ar' ? "وصف مختصر للمبادرة..." : "Short project description..."} />
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#1E1B4B] text-white font-black py-8 rounded-[2.5rem] shadow-[0_20px_40px_-10px_rgba(30,27,75,0.4)] text-2xl hover:bg-[#2D2A5E] hover:scale-[1.02] transition-all active:scale-95 border-b-8 border-[#B4975A]">
                  {t.start}
                </button>
              </form>
            </div>
          </div>
        )}

        {step === Step.Ideas && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="text-center">
              <h2 className="text-4xl font-black text-[#1E1B4B] mb-2">{t.ideasTitle}</h2>
              <button onClick={() => setStep(Step.Input)} className="text-[#B4975A] font-black hover:underline uppercase text-xs tracking-widest">← {t.back}</button>
            </div>
            <div className="grid md:grid-cols-2 gap-10">
              {ideas.map((idea) => (
                <div key={idea.id} onClick={() => handleSelectIdea(idea)}
                  className="glass-card p-12 rounded-[3.5rem] shadow-2xl hover:border-[#B4975A] cursor-pointer border-2 border-transparent transition-all group relative overflow-hidden">
                  <span className="inline-block bg-[#1E1B4B] text-white text-[10px] font-black px-5 py-2 rounded-full mb-8 uppercase tracking-widest shadow-lg">{idea.sector}</span>
                  <h3 className="text-2xl font-black text-[#1E1B4B] mb-6 group-hover:text-[#B4975A] transition-colors">{idea.name}</h3>
                  <p className="text-slate-600 text-sm mb-10 leading-relaxed font-bold line-clamp-3">{idea.description}</p>
                  <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{idea.targetGroup}</span>
                    <button className="text-[#B4975A] font-black text-sm group-hover:translate-x-2 transition-transform">{t.select}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === Step.Proposal && proposal && (
          <div className="space-y-10 animate-in zoom-in-95 duration-700">
            <div className="glass-card p-5 rounded-[2.5rem] flex flex-wrap justify-between items-center no-print sticky top-24 z-40 border border-[#B4975A]/20 shadow-2xl gap-4">
              <div className="flex bg-slate-100 p-2 rounded-2xl">
                <button onClick={() => setActiveTab('narrative')} className={`px-10 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'narrative' ? 'bg-[#1E1B4B] text-white shadow-xl' : 'text-slate-500'}`}>{t.narrative}</button>
                <button onClick={() => setActiveTab('financial')} className={`px-10 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'financial' ? 'bg-[#1E1B4B] text-white shadow-xl' : 'text-slate-500'}`}>{t.financial}</button>
              </div>
              <div className="flex gap-4">
                <button onClick={downloadWord} className="bg-[#B4975A] text-white px-8 py-3 rounded-xl text-xs font-black shadow-lg hover:brightness-110 transition-all">{t.downloadWord}</button>
                <button onClick={downloadExcel} className="bg-emerald-700 text-white px-8 py-3 rounded-xl text-xs font-black shadow-lg hover:brightness-110 transition-all">{t.downloadExcel}</button>
                <button onClick={() => setStep(Step.Ideas)} className="bg-[#1E1B4B] text-white px-8 py-3 rounded-xl text-xs font-black">{t.back}</button>
              </div>
            </div>

            <div className="glass-card rounded-[4.5rem] p-12 md:p-24 shadow-3xl bg-white relative overflow-hidden border-b-[20px] border-b-[#B4975A]">
              {activeTab === 'narrative' ? (
                <div className="space-y-24 relative">
                  <header className="text-center pb-16 border-b-4 border-slate-50">
                    <h1 className="text-6xl font-black text-[#1E1B4B] mb-8 leading-tight">{proposal.title}</h1>
                  </header>
                  <section className="space-y-20">
                    <article>
                      <h3 className="text-3xl font-black text-[#1E1B4B] mb-8 flex items-center">
                        <span className="w-12 h-12 bg-[#B4975A] text-white rounded-2xl flex items-center justify-center mr-4 ml-4 text-sm shadow-lg">01</span>
                        {t.execSummary}
                      </h3>
                      <p className="text-slate-700 leading-relaxed text-justify text-2xl font-medium">{proposal.executiveSummary}</p>
                    </article>
                  </section>
                </div>
              ) : (
                <div className="space-y-20">
                  <header className="text-center pb-16 border-b-4 border-slate-50">
                    <h2 className="text-5xl font-black text-[#1E1B4B] mb-4">{t.budgetEdit}</h2>
                  </header>
                  <div className="bg-[#1E1B4B] text-white p-24 rounded-[5rem] text-center shadow-2xl relative overflow-hidden border-t-8 border-t-[#B4975A]">
                    <p className="text-8xl font-black mb-10 tracking-tighter text-white">
                      ${(proposal?.budget || []).reduce((s: number, i: BudgetItem) => s + i.total, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;


import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Step, ProjectIdea, ProjectProposal, BudgetItem } from './types';
import { generateProjectIdeas, generateFullProposal } from './services/geminiService';
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
  
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Translation Map
  const t = {
    ar: {
      welcome: "أهلاً بك في آداة أثر الذكية",
      subWelcome: "حوّل رؤيتك التنموية إلى مقترحات عالمية المستوى في ثوانٍ.",
      targetTitle: "🎯 الهدف من المنصة",
      targetDesc: "منصة ويب إنسانية تساعد المنظمات غير الحكومية على تخطيط مشاريعها، كتابة مقترحات احترافية، وقياس الأثر بطريقة بسيطة وذكية.",
      country: "الدولة المستهدفة",
      vision: "رؤية/وصف المشروع",
      optional: "اختياري: مطابقة تصميم ميزانية خاص؟",
      upload: "رفع قالب Excel",
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
      risks: "إدارة المخاطر"
    },
    en: {
      welcome: "Welcome to ATHAR Architect",
      subWelcome: "Transform your development vision into world-class proposals in seconds.",
      targetTitle: "🎯 Platform Goal",
      targetDesc: "A humanitarian web platform that helps NGOs plan their projects, write professional proposals, and measure impact in a simple and smart way.",
      country: "Target Country",
      vision: "Project Vision/Description",
      optional: "Optional: Match a specific budget layout?",
      upload: "Upload Excel Template",
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
      risks: "Risk Management"
    }
  }[lang];

  useEffect(() => {
    document.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const groupedBudget = useMemo<Record<string, EditableBudgetItem[]>>(() => {
    if (!proposal) return {};
    const groups: Record<string, EditableBudgetItem[]> = {};
    proposal.budget.forEach((item, index) => {
      const cat = item.category || (lang === 'ar' ? "بنود عامة" : "General Items");
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ ...item, originalIndex: index });
    });
    return groups;
  }, [proposal, lang]);

  const handleUpdateBudgetItem = (index: number, field: keyof BudgetItem, value: any) => {
    if (!proposal) return;
    const newBudget = [...proposal.budget];
    const item = { ...newBudget[index] };
    if (field === 'monthlyCost' || field === 'frequency' || field === 'total') {
      (item as any)[field] = parseFloat(value) || 0;
    } else { (item as any)[field] = value; }
    if (field === 'monthlyCost' || field === 'frequency' || field === 'quantity') {
      const q = parseFloat(String(item.quantity).match(/\d+/)?.[0] || "1");
      item.total = item.monthlyCost * item.frequency * q;
    }
    newBudget[index] = item;
    setProposal({ ...proposal, budget: newBudget });
  };

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingMessage(t.loadingContext);
    try {
      const suggestedIdeas = await generateProjectIdeas(vision, country, lang);
      setIdeas(suggestedIdeas);
      setStep(Step.Ideas);
    } catch (error) { alert(lang === 'ar' ? 'خطأ في الاتصال' : 'Connection Error'); }
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
    } catch (error) { alert(lang === 'ar' ? 'خطأ في الصياغة' : 'Drafting Error'); }
    finally { setLoading(false); }
  };

  const downloadWord = async () => {
    if (!proposal) return;
    const { Document, Packer, Paragraph, HeadingLevel, AlignmentType, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } = docx;

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
      new Paragraph({ children: [new TextRun({ text: lang === 'ar' ? "نقاط القوة:" : "Strengths:", bold: true, color: "059669" })], alignment: align, bidirectional: isRtl }),
      createText(proposal.swot?.strengths?.join(", ") || ""),
      new Paragraph({ children: [new TextRun({ text: lang === 'ar' ? "الفرص:" : "Opportunities:", bold: true, color: "D97706" })], alignment: align, bidirectional: isRtl }),
      createText(proposal.swot?.opportunities?.join(", ") || ""),
      new Paragraph({ children: [new TextRun({ text: lang === 'ar' ? "التحديات والمخاطر:" : "Threats & Challenges:", bold: true, color: "DC2626" })], alignment: align, bidirectional: isRtl }),
      createText(proposal.swot?.threats?.join(", ") || ""),

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
    children.push(new Paragraph({ children: [new TextRun({ text: lang === 'ar' ? "المؤشرات:" : "Indicators:", bold: true })], alignment: align, bidirectional: isRtl }));
    children.push(createText(proposal.mePlan?.indicators?.join(" | ") || ""));
    children.push(new Paragraph({ children: [new TextRun({ text: lang === 'ar' ? "الآلية والأدوات:" : "Mechanism & Tools:", bold: true })], alignment: align, bidirectional: isRtl }));
    children.push(createText(`${proposal.mePlan?.mechanism || ""} - Tools: ${proposal.mePlan?.tools?.join(", ")}`));

    children.push(createHeading(`8. ${t.sustainability}`, HeadingLevel.HEADING_2));
    children.push(createText(proposal.sustainability || ""));

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
    XLSX.writeFile(workbook, `ATHAR_Budget_${proposal.title.substring(0,15)}.xlsx`);
  };

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
        {/* Lang Switcher */}
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
                
                {/* قسم الهدف من المنصة المنسق بشكل جميل */}
                <div className="target-section p-8 rounded-[2.5rem] mb-16 text-right animate-in slide-in-from-right-10 duration-1000">
                  <h3 className="text-2xl font-black text-[#1E1B4B] mb-4 flex items-center">
                    <span className="target-icon-bounce mr-3 ml-3 text-3xl">🎯</span>
                    {t.targetTitle}
                  </h3>
                  <p className="text-slate-600 text-lg leading-relaxed font-bold">
                    {t.targetDesc}
                  </p>
                </div>
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
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#B4975A]/10 to-transparent rounded-bl-full transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform"></div>
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
                    <div className="mb-8 inline-block animate-float">
                      <div className="w-20 h-20 bg-[#1E1B4B] rounded-3xl flex items-center justify-center shadow-2xl border-2 border-[#B4975A]">
                         <text className="text-3xl font-black text-[#B4975A]">أ</text>
                      </div>
                    </div>
                    <h1 className="text-6xl font-black text-[#1E1B4B] mb-8 leading-tight">{proposal.title}</h1>
                    <div className="flex flex-wrap justify-center gap-8 text-[11px] font-black uppercase tracking-[0.3em] text-[#B4975A]">
                      <span className="bg-[#1E1B4B] text-white px-4 py-1 rounded-lg">{country}</span>
                      <span className="self-center opacity-30">/</span>
                      <span>{selectedIdea?.sector}</span>
                      <span className="self-center opacity-30">/</span>
                      <span>NGO Standards</span>
                    </div>
                  </header>

                  <section className="grid lg:grid-cols-3 gap-20">
                    <div className="lg:col-span-2 space-y-20">
                      <article>
                        <h3 className="text-3xl font-black text-[#1E1B4B] mb-8 flex items-center">
                          <span className="w-12 h-12 bg-[#B4975A] text-white rounded-2xl flex items-center justify-center mr-4 ml-4 text-sm shadow-lg">01</span>
                          {t.execSummary}
                        </h3>
                        <p className="text-slate-700 leading-relaxed text-justify text-2xl font-medium first-letter:text-5xl first-letter:font-black first-letter:text-[#B4975A]">{proposal.executiveSummary}</p>
                      </article>

                      <article>
                        <h3 className="text-3xl font-black text-[#1E1B4B] mb-8 flex items-center">
                          <span className="w-12 h-12 bg-[#B4975A] text-white rounded-2xl flex items-center justify-center mr-4 ml-4 text-sm shadow-lg">02</span>
                          {t.probAnalysis}
                        </h3>
                        <div className="bg-[#1E1B4B]/5 p-12 rounded-[3.5rem] border-r-8 border-[#B4975A] space-y-10 shadow-inner">
                          <p className="text-slate-700 text-xl leading-relaxed font-bold">{proposal.problemAnalysis}</p>
                          <div className="bg-[#1E1B4B] p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-2 h-full bg-[#B4975A]"></div>
                             <h4 className="font-black text-[#B4975A] mb-4 text-sm uppercase tracking-widest">{t.toc}:</h4>
                             <p className="italic font-bold text-lg leading-relaxed text-indigo-100">{proposal.theoryOfChange}</p>
                          </div>
                        </div>
                      </article>

                      <article>
                        <h3 className="text-3xl font-black text-[#1E1B4B] mb-8 flex items-center">
                          <span className="w-12 h-12 bg-[#B4975A] text-white rounded-2xl flex items-center justify-center mr-4 ml-4 text-sm shadow-lg">03</span>
                          {t.meTitle}
                        </h3>
                        <div className="bg-[#B4975A]/10 p-12 rounded-[3.5rem] border border-[#B4975A]/20 space-y-8">
                           <div className="space-y-6">
                             <h4 className="font-black text-[#1E1B4B] text-sm uppercase tracking-widest tracking-tighter">{lang === 'ar' ? 'مؤشرات الأداء الرئيسية (KPIs):' : 'Key Performance Indicators (KPIs):'}</h4>
                             <ul className="grid md:grid-cols-2 gap-6">
                               {proposal.mePlan?.indicators?.map((ind, i) => (
                                 <li key={i} className="bg-white p-6 rounded-[2rem] text-xs font-black text-slate-700 shadow-md border-r-4 border-[#B4975A] flex items-center">
                                    <span className="text-[#B4975A] text-xl mr-3 ml-3">◈</span> {ind}
                                 </li>
                               ))}
                             </ul>
                           </div>
                           <div className="pt-6 border-t border-[#B4975A]/20">
                             <h4 className="font-black text-[#1E1B4B] text-sm uppercase mb-2">{lang === 'ar' ? 'أدوات القياس المعتمدة:' : 'Measurement Tools:'}</h4>
                             <p className="text-slate-500 text-xs font-black italic">{proposal.mePlan?.tools?.join(" • ")}</p>
                           </div>
                        </div>
                      </article>
                    </div>

                    <aside className="space-y-10">
                       <div className="bg-[#1E1B4B] text-white p-12 rounded-[4rem] shadow-3xl border-b-[12px] border-[#B4975A]">
                         <h3 className="text-2xl font-black mb-10 text-center border-b border-white/10 pb-8 uppercase tracking-tighter text-[#B4975A]">{t.swotTitle}</h3>
                         <div className="space-y-10">
                           <div className="group">
                             <div className="text-[#B4975A] text-[10px] font-black mb-4 uppercase tracking-[0.3em] flex items-center">
                               <span className="w-2 h-2 bg-[#B4975A] rounded-full mr-2 ml-2"></span>
                               {lang === 'ar' ? 'نقاط القوة' : 'Strengths'}
                             </div>
                             <ul className="text-xs space-y-3 text-slate-300 font-bold">
                               {proposal.swot?.strengths?.map((s, i) => <li key={i} className="hover:text-white transition-colors">• {s}</li>)}
                             </ul>
                           </div>
                           <div>
                             <div className="text-[#B4975A] text-[10px] font-black mb-4 uppercase tracking-[0.3em] flex items-center">
                               <span className="w-2 h-2 bg-[#B4975A] rounded-full mr-2 ml-2 opacity-50"></span>
                               {lang === 'ar' ? 'الفرص المتاحة' : 'Opportunities'}
                             </div>
                             <ul className="text-xs space-y-3 text-slate-300 font-bold">
                               {proposal.swot?.opportunities?.map((o, i) => <li key={i} className="hover:text-white transition-colors">• {o}</li>)}
                             </ul>
                           </div>
                           <div>
                             <div className="text-red-400 text-[10px] font-black mb-4 uppercase tracking-[0.3em] flex items-center">
                               <span className="w-2 h-2 bg-red-400 rounded-full mr-2 ml-2"></span>
                               {lang === 'ar' ? 'المخاطر والتهديدات' : 'Threats'}
                             </div>
                             <ul className="text-xs space-y-3 text-slate-300 font-bold">
                               {proposal.swot?.threats?.map((t, i) => <li key={i} className="hover:text-red-200 transition-colors">• {t}</li>)}
                             </ul>
                           </div>
                         </div>
                       </div>
                       
                       <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200">
                          <h4 className="text-[#1E1B4B] font-black text-sm mb-4">Sustainability Strategy</h4>
                          <p className="text-slate-500 text-xs leading-relaxed font-bold">{proposal.sustainability}</p>
                       </div>
                    </aside>
                  </section>

                  <section>
                    <h3 className="text-3xl font-black text-[#1E1B4B] mb-12 text-center uppercase tracking-widest">{t.activitiesTitle}</h3>
                    <div className="overflow-x-auto rounded-[3.5rem] border-2 border-slate-100 shadow-3xl overflow-hidden bg-white">
                      <table className={`w-full ${lang === 'ar' ? 'text-right' : 'text-left'} border-collapse`}>
                        <thead className="bg-[#1E1B4B] text-white">
                          <tr>
                            <th className="p-10 text-xs font-black uppercase tracking-widest text-[#B4975A]">{lang === 'ar' ? 'النشاط الرئيسي' : 'Main Activity'}</th>
                            <th className="p-10 text-xs font-black uppercase tracking-widest text-[#B4975A]">{lang === 'ar' ? 'المنهجية الفنية' : 'Technical Methodology'}</th>
                            <th className="p-10 text-xs font-black uppercase tracking-widest text-[#B4975A]">{lang === 'ar' ? 'مخرج الأثر' : 'Impact Output'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {proposal.activities?.map((a, i) => (
                            <tr key={i} className="hover:bg-[#B4975A]/5 transition-colors group">
                              <td className="p-10 font-black text-[#1E1B4B] text-base group-hover:text-[#B4975A]">{a.activity}</td>
                              <td className="p-10 text-slate-600 text-sm leading-relaxed font-bold">{a.details}</td>
                              <td className="p-10">
                                <span className="bg-[#1E1B4B]/5 text-[#1E1B4B] px-4 py-2 rounded-xl text-xs font-black border border-[#1E1B4B]/10 block text-center">
                                  {a.output}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              ) : (
                <div className="space-y-20 animate-in slide-in-from-left-10 duration-700">
                  <header className="text-center pb-16 border-b-4 border-slate-50">
                    <h2 className="text-5xl font-black text-[#1E1B4B] mb-4">{t.budgetEdit}</h2>
                    <p className="text-[#B4975A] text-xs font-black uppercase tracking-[0.5em]">Financial Accuracy Matrix</p>
                  </header>

                  <div className="space-y-16">
                    {Object.entries(groupedBudget).map(([cat, items]) => (
                      <div key={cat} className="rounded-[3.5rem] border-2 border-slate-50 shadow-2xl overflow-hidden bg-white">
                        <div className="bg-[#1E1B4B] text-white p-10 flex justify-between items-center">
                          <h4 className="font-black text-2xl tracking-tight">{cat}</h4>
                          <span className="bg-[#B4975A] px-8 py-3 rounded-2xl text-sm font-black text-white shadow-xl">
                            ${(items as EditableBudgetItem[]).reduce((s, i) => s + i.total, 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className={`w-full ${lang === 'ar' ? 'text-right' : 'text-left'} text-sm`}>
                            <thead className="bg-slate-50 text-slate-400 font-black border-b border-slate-100">
                              <tr>
                                <th className="p-8 uppercase tracking-widest text-[10px]">{t.item}</th>
                                <th className="p-8 text-center uppercase tracking-widest text-[10px]">{t.cost}</th>
                                <th className="p-8 text-center uppercase tracking-widest text-[10px]">{t.qty}</th>
                                <th className="p-8 text-center uppercase tracking-widest text-[10px]">{t.freq}</th>
                                <th className="p-8 text-center uppercase tracking-widest text-[10px]">{t.grandTotal}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {(items as EditableBudgetItem[]).map((item, i) => (
                                <tr key={i} className="hover:bg-[#B4975A]/5 transition-all">
                                  <td className="p-8">
                                    <input className="w-full font-black text-[#1E1B4B] bg-transparent outline-none focus:ring-2 focus:ring-[#B4975A]/20 rounded-xl p-2 text-lg" value={item.item} onChange={(e) => handleUpdateBudgetItem(item.originalIndex, 'item', e.target.value)} />
                                    <input className="w-full text-xs text-slate-400 bg-transparent outline-none mt-2 px-2" value={item.description} onChange={(e) => handleUpdateBudgetItem(item.originalIndex, 'description', e.target.value)} />
                                  </td>
                                  <td className="p-8 text-center">
                                    <input type="number" className="w-28 text-center bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 font-black text-[#1E1B4B] focus:border-[#B4975A] transition-all" value={item.monthlyCost} onChange={(e) => handleUpdateBudgetItem(item.originalIndex, 'monthlyCost', e.target.value)} />
                                  </td>
                                  <td className="p-8 text-center font-black text-slate-600 bg-slate-50/50">{item.quantity} {item.unit}</td>
                                  <td className="p-8 text-center">
                                    <input type="number" className="w-20 text-center bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 font-black text-[#1E1B4B] focus:border-[#B4975A] transition-all" value={item.frequency} onChange={(e) => handleUpdateBudgetItem(item.originalIndex, 'frequency', e.target.value)} />
                                  </td>
                                  <td className="p-8 text-center font-black text-[#B4975A] text-xl shadow-inner">${item.total.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#1E1B4B] text-white p-24 rounded-[5rem] text-center shadow-[0_40px_80px_-20px_rgba(30,27,75,0.6)] relative overflow-hidden border-t-8 border-t-[#B4975A]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#B4975A]/20 via-transparent to-transparent"></div>
                    <div className="relative z-10">
                       <p className="text-[#B4975A] font-black mb-8 uppercase tracking-[0.5em] text-sm">{lang === 'ar' ? 'إجمالي المنحة المطلوبة' : 'Total Grant Requested'}</p>
                       <p className="text-8xl font-black mb-10 tracking-tighter text-white drop-shadow-2xl">
                         ${(proposal?.budget || []).reduce((s: number, i: BudgetItem) => s + i.total, 0).toLocaleString()}
                       </p>
                       <div className="h-[2px] w-32 bg-[#B4975A] mx-auto mb-8 opacity-50"></div>
                       <p className="text-xs text-indigo-300 font-bold uppercase tracking-[0.3em]">International Development Standard • Financial Year {new Date().getFullYear()}</p>
                    </div>
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


import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Headphones, Keyboard, Settings, Sparkles, Trophy, Volume2, CheckCircle2, XCircle, RotateCw, Send, PlusCircle, BarChart3, Home } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const DEFAULT_WORDS = [
  { id: 1, en: "accurate", phon: "/ˈækjərət/", cn: "准确的", pos: "adj", eg: "Her report is accurate and easy to read." },
  { id: 2, en: "afford", phon: "/əˈfɔːrd/", cn: "买得起; 承担得起", pos: "v", eg: "I can't afford a new car this year." },
  { id: 3, en: "attention", phon: "/əˈtɛnʃən/", cn: "注意", pos: "n", eg: "Please pay attention to the instructions." },
  { id: 4, en: "benefit", phon: "/ˈbɛnɪfɪt/", cn: "好处; 受益", pos: "n/v", eg: "Exercise brings many health benefits." },
  { id: 5, en: "contrast", phon: "/ˈkɒntrɑːst/", cn: "对比", pos: "n/v", eg: "The essay contrasts two education systems." },
  { id: 6, en: "device", phon: "/dɪˈvaɪs/", cn: "设备", pos: "n", eg: "This device measures temperature." },
  { id: 7, en: "efficient", phon: "/ɪˈfɪʃənt/", cn: "高效的", pos: "adj", eg: "The new method is more efficient." },
  { id: 8, en: "maintain", phon: "/meɪnˈteɪn/", cn: "维持; 保持", pos: "v", eg: "It's hard to maintain a daily routine." },
  { id: 9, en: "option", phon: "/ˈɒpʃən/", cn: "选项", pos: "n", eg: "We have several options to choose from." },
  { id: 10, en: "variety", phon: "/vəˈraɪəti/", cn: "多样性; 种类", pos: "n", eg: "The menu offers a good variety of dishes." }
];

const LEVEL_INTERVALS = [1,1,2,3,5,8];

function useLocalStorage(key, initial){
  const [value, setValue] = useState(()=>{
    try{ const v = localStorage.getItem(key); return v? JSON.parse(v): initial; }catch{ return initial; }
  });
  useEffect(()=>{ try{ localStorage.setItem(key, JSON.stringify(value)); }catch{} }, [key, value]);
  return [value, setValue];
}

function Header({ targetBand, setTargetBand }){
  return (
    <div className="w-full flex items-center justify-between p-4 bg-white/60 backdrop-blur sticky top-0 z-20 border-b">
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6" />
        <h1 className="text-2xl font-semibold">English Sprint — MVP</h1>
        <span className="text-sm text-slate-500 hidden sm:inline">IELTS Band {targetBand}</span>
      </div>
      <div className="flex items-center gap-2">
        <select className="input w-[140px]" value={String(targetBand)} onChange={(e)=>setTargetBand(Number(e.target.value))}>
          {[4,5,6,7,8].map(b=> (<option key={b} value={String(b)}>Target: Band {b}</option>))}
        </select>
        <button className="btn"><Settings className="w-4 h-4"/> Settings</button>
      </div>
    </div>
  );
}

function Sidebar({ tab, setTab }){
  const items = [
    { id: "home", label: "Home", icon: Home },
    { id: "vocab", label: "Vocabulary", icon: BookOpen },
    { id: "quiz", label: "Quiz", icon: Keyboard },
    { id: "listening", label: "Listening", icon: Headphones },
    { id: "writing", label: "Writing", icon: Send },
    { id: "progress", label: "Progress", icon: BarChart3 }
  ];
  return (
    <div className="w-full sm:w-56 flex sm:flex-col gap-2 p-3 bg-white/50 rounded-2xl shadow">
      {items.map(({ id, label, icon:Icon }) => (
        <button key={id} onClick={()=>setTab(id)} className={`btn ${tab===id? 'btn-solid':''} justify-start`}>
          <Icon className="w-4 h-4"/><span>{label}</span>
        </button>
      ))}
    </div>
  );
}

function HomeDash({ streak, setShowAddWord }){
  const tasks = [
    { id: 1, title: "Review 10 words", done: false },
    { id: 2, title: "1 short listening", done: false },
    { id: 3, title: "Write 80–120 words", done: false }
  ];
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Today's Focus</h3>
          <Trophy className="w-5 h-5"/>
        </div>
        <ul className="mt-3 space-y-2">
          {tasks.map(t=> (
            <li key={t.id} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4"/>
              {t.title}
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <button onClick={()=>setShowAddWord(true)} className="btn"><PlusCircle className="w-4 h-4"/> Add new word</button>
        </div>
      </div>
      <div className="card">
        <h3 className="font-semibold text-lg">Daily Streak</h3>
        <p className="text-5xl font-bold mt-2">{streak} 🔥</p>
        <p className="text-slate-500 mt-2">Keep it going! Do any activity to extend your streak.</p>
      </div>
      <div className="card">
        <h3 className="font-semibold text-lg">Tips (Band 5–6)</h3>
        <ul className="text-sm mt-2 list-disc list-inside space-y-1">
          <li>Use clear topic sentences in writing.</li>
          <li>Paraphrase the question before you answer.</li>
          <li>Prefer simple, correct grammar over complex errors.</li>
        </ul>
      </div>
    </div>
  );
}

function VocabTrainer({ store, setStore }){
  const [filter, setFilter] = useState("");
  const [mode, setMode] = useState("flash");
  const today = useMemo(()=> new Date().toDateString(), []);
  const due = store.words.filter(w => !w.next || new Date(w.next).toDateString() <= today);

  function schedule(word, correct){
    const level = Math.max(0, Math.min(LEVEL_INTERVALS.length-1, (word.level||0) + (correct?1:-1)));
    const days = LEVEL_INTERVALS[level];
    const next = new Date(); next.setDate(next.getDate()+days);
    updateWord({ ...word, level, last: new Date().toISOString(), next: next.toISOString() });
  }
  function updateWord(updated){
    setStore(s=> ({...s, words: s.words.map(w=> w.id===updated.id? updated: w)}));
  }
  function addWord(en, cn){
    const id = Math.max(0, ...store.words.map(w=>w.id))+1;
    setStore(s=> ({...s, words: [...s.words, { id, en, cn, pos: "", phon: "", eg: "" }]}));
  }

  const shown = store.words.filter(w => w.en.toLowerCase().includes(filter.toLowerCase()) || w.cn.includes(filter));

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="card lg:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Spaced Repetition</h3>
          <div className="flex gap-2">
            <button className={`btn ${mode==='flash'?'btn-solid':''}`} onClick={()=>setMode('flash')}>Flashcards</button>
            <button className={`btn ${mode==='type'?'btn-solid':''}`} onClick={()=>setMode('type')}>Type</button>
          </div>
        </div>
        {mode === "flash" && (<Flashcards words={due.length? due: store.words.slice(0,8)} onAnswer={schedule} />)}
        {mode === "type" && (<TypePractice words={due.length? due: store.words.slice(0,5)} onAnswer={schedule} />)}
      </div>
      <div className="card">
        <h3 className="font-semibold text-lg">Your word bank</h3>
        <input className="input mt-3" placeholder="Search 英文/中文" value={filter} onChange={e=>setFilter(e.target.value)} />
        <ul className="max-h-72 overflow-auto divide-y rounded-xl mt-3">
          {shown.map(w=> (
            <li key={w.id} className="p-3 text-sm flex items-center justify-between">
              <div>
                <div className="font-semibold">{w.en} <span className="text-slate-500">{w.phon}</span></div>
                <div className="text-slate-500">{w.cn} {w.pos? `• ${w.pos}`: ''}</div>
              </div>
              <div className="pill">Lv {w.level||0}</div>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input id="new-en" className="input" placeholder="English word"/>
          <input id="new-cn" className="input" placeholder="中文释义"/>
          <button className="btn" onClick={()=>{
            const en = document.getElementById('new-en').value.trim();
            const cn = document.getElementById('new-cn').value.trim();
            if(en && cn){ addWord(en, cn); document.getElementById('new-en').value=''; document.getElementById('new-cn').value=''; }
          }}><PlusCircle className="w-4 h-4"/>Add</button>
        </div>
      </div>
    </div>
  );
}

function Flashcards({ words, onAnswer }){
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(false);
  const w = words[idx];
  if(!w) return <p className="text-sm text-slate-500 mt-4">No words due. Add more or switch mode.</p>;
  function next(correct){
    onAnswer?.(w, correct);
    setShow(false);
    setIdx(i=> Math.min(words.length-1, i+1));
  }
  return (
    <div className="mt-4">
      <motion.div className="p-8 rounded-2xl bg-white shadow text-center" initial={{rotateY:0}} animate={{rotateY: show? 180:0}}>
        <div className="text-2xl font-semibold">{show? w.cn: w.en}</div>
        <div className="mt-2 text-sm text-slate-500">{show? w.eg: w.phon}</div>
      </motion.div>
      <div className="flex items-center gap-2 mt-4">
        <button className="btn" onClick={()=>setShow(s=>!s)}><RotateCw className="w-4 h-4"/>Flip</button>
        <button className="btn" onClick={()=>next(false)}><XCircle className="w-4 h-4"/>Hard</button>
        <button className="btn btn-solid" onClick={()=>next(true)}><CheckCircle2 className="w-4 h-4"/>Easy</button>
      </div>
    </div>
  );
}

function TypePractice({ words, onAnswer }){
  const [idx, setIdx] = useState(0);
  const [val, setVal] = useState("");
  const [ok, setOk] = useState(null);
  const w = words[idx];
  if(!w) return null;
  function check(){
    const correct = val.trim().toLowerCase() === w.en.toLowerCase();
    setOk(correct);
    onAnswer?.(w, correct);
    setTimeout(()=>{ setVal(""); setOk(null); setIdx(i=> Math.min(words.length-1, i+1)); }, 600);
  }
  return (
    <div className="mt-4">
      <div className="p-6 rounded-2xl bg-white shadow">
        <div className="text-sm text-slate-500">中文释义</div>
        <div className="text-xl font-semibold">{w.cn}</div>
        <div className="mt-4 flex gap-2">
          <input className="input" placeholder="输入英文拼写" value={val} onChange={e=>setVal(e.target.value)} onKeyDown={(e)=> e.key==='Enter' && check()}/>
          <button className="btn btn-solid" onClick={check}>Check</button>
        </div>
        {ok!==null && (<div className={`mt-2 text-sm ${ok? 'text-green-600':'text-red-600'}`}>{ok? '✅ Correct!':'❌ Try again.'}</div>)}
      </div>
    </div>
  );
}

function Quiz({ store }){
  const questions = useMemo(()=> makeQuestions(store.words), [store.words]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const q = questions[idx];
  function next(){
    if(selected === q.answer) setScore(s=>s+1);
    setSelected(null);
    setIdx(i=> i+1);
  }
  if(idx >= questions.length){
    const rate = Math.round((score/questions.length)*100);
    return <div className="card text-center"><div className="text-2xl font-semibold">Your score: {score}/{questions.length} ({rate}%)</div><p className="text-slate-500 mt-2">Tip: Review the mistakes in your word bank.</p></div>;
  }
  return (
    <div className="card">
      <div className="text-sm text-slate-500">Question {idx+1} / {questions.length}</div>
      <div className="text-lg font-semibold mt-2">{q.prompt}</div>
      <div className="grid sm:grid-cols-2 gap-2 mt-4">
        {q.options.map((opt,i)=> (
          <button key={i} onClick={()=>setSelected(opt)} className={`text-left p-3 rounded-xl border ${selected===opt? 'border-black':'border-transparent'} bg-white shadow`}>{opt}</button>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button className="btn btn-solid" onClick={next}>Next</button>
      </div>
    </div>
  );
}

function makeQuestions(words){
  const pool = words.length ? words : DEFAULT_WORDS;
  const pick = (arr, n) => arr.slice().sort(()=>Math.random()-0.5).slice(0,n);
  const qs = pick(pool, Math.min(8, pool.length)).map(w=> ({
    prompt: `Choose the best translation for: "${w.en}"`,
    options: pick(pool.filter(x=>x.id!==w.id), 3).map(x=>x.cn).concat([w.cn]).sort(()=>Math.random()-0.5),
    answer: w.cn
  }));
  return qs;
}

function ListeningLab(){
  const samples = [
    { id: 1, title: "Ordering Coffee", script: "Could I have a medium latte to go, please?", url: "" },
    { id: 2, title: "At the Hotel", script: "I'd like to check in. The reservation is under Ji.", url: "" }
  ];
  const [idx, setIdx] = useState(0);
  const s = samples[idx];
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="card">
        <h3 className="font-semibold text-lg flex items-center gap-2"><Volume2 className="w-5 h-5"/> Short Dialogue</h3>
        <p className="text-sm text-slate-500 mt-2">Play the line and shadow it. Then type what you hear.</p>
        <div className="mt-4 p-4 rounded-xl bg-white shadow">
          <div className="text-sm text-slate-500">Topic</div>
          <div className="font-semibold">{s.title}</div>
          <div className="mt-2 text-sm">{s.script}</div>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="btn" onClick={()=> setIdx(i=> i? i-1: 0)}>Prev</button>
          <button className="btn btn-solid" onClick={()=> setIdx(i=> Math.min(samples.length-1, i+1))}>Next</button>
        </div>
      </div>
      <DictationBox text={s.script} />
    </div>
  );
}

function DictationBox({ text }){
  const [val, setVal] = useState("");
  const [feedback, setFeedback] = useState(null);
  function check(){
    const norm = (s)=> s.toLowerCase().replace(/[^a-z\s']/g, '').replace(/\s+/g,' ').trim();
    const correct = norm(val) === norm(text);
    setFeedback(correct? { ok:true, msg: "Perfect!" } : { ok:false, msg: suggest(norm(val), norm(text)) });
  }
  return (
    <div className="card">
      <h3 className="font-semibold text-lg">Dictation</h3>
      <textarea className="textarea mt-3" placeholder="Type what you hear…" value={val} onChange={e=>setVal(e.target.value)} />
      <div className="mt-3 flex gap-2">
        <button className="btn btn-solid" onClick={check}>Check</button>
        <button className="btn" onClick={()=>setVal("")}>Clear</button>
      </div>
      {feedback && (<div className={`mt-3 text-sm ${feedback.ok? 'text-green-700':'text-amber-700'}`}>{feedback.msg}</div>)}
    </div>
  );
}

function suggest(user, gold){
  if(!user) return "Hint: Start with capital letter and listen for articles (a/an/the).";
  const u = user.split(' '), g = gold.split(' ');
  const missing = g.filter(x=> !u.includes(x)).slice(0,3);
  return `Check missing words: ${missing.join(', ')}`;
}

function WritingCoach({ targetBand }){
  const [topic, setTopic] = useState("Some people think technology makes life easier. Do you agree?");
  const [text, setText] = useState("");
  const [report, setReport] = useState(null);
  function analyze(){
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const sents = text.split(/[.!?]+/).filter(s=>s.trim().length>0).length || 1;
    const avgLen = Math.round(words / sents);
    const vocab = new Set(text.toLowerCase().replace(/[^a-z\s]/g,'').split(/\s+/).filter(Boolean));
    const advice = [];
    if(words < 90) advice.push("Aim for 90–120 words for this task.");
    if(avgLen < 10) advice.push("Combine short sentences to improve flow.");
    if(vocab.size < words*0.6) advice.push("Avoid repeating the same words.");
    const estBand = Math.min(8, Math.max(4, Math.round((avgLen>12?1:0) + (words>100?1:0) + (vocab.size>0.7*words?1:0) + targetBand)));
    setReport({ words, sents, avgLen, advice, estBand });
  }
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="card lg:col-span-2">
        <h3 className="font-semibold text-lg">Task 2 Mini (Band {targetBand})</h3>
        <input className="input mt-3" value={topic} onChange={e=>setTopic(e.target.value)} />
        <textarea className="textarea mt-3 min-h-[220px]" placeholder="Write 90–120 words…" value={text} onChange={e=>setText(e.target.value)} />
        <div className="flex gap-2 mt-2">
          <button className="btn btn-solid" onClick={analyze}>Analyze</button>
          <button className="btn" onClick={()=>{setText(""); setReport(null);}}>Reset</button>
        </div>
      </div>
      <div className="card">
        <h3 className="font-semibold text-lg">Feedback</h3>
        {report? (
          <div className="text-sm space-y-2">
            <div>Words: <b>{report.words}</b> • Sentences: <b>{report.sents}</b> • Avg length: <b>{report.avgLen}</b></div>
            <div>Estimated band: <b>{report.estBand}</b></div>
            <ul className="list-disc list-inside space-y-1">
              {report.advice.map((a,i)=> <li key={i}>{a}</li>)}
            </ul>
          </div>
        ): <p className="text-slate-500 text-sm">Write and click Analyze for instant tips.</p>}
      </div>
    </div>
  );
}

function ProgressView({ history }){
  const data = history.length? history: [
    { day: "Mon", words: 12, quiz: 60 },
    { day: "Tue", words: 14, quiz: 70 },
    { day: "Wed", words: 8, quiz: 55 },
    { day: "Thu", words: 16, quiz: 80 },
    { day: "Fri", words: 10, quiz: 65 },
    { day: "Sat", words: 18, quiz: 85 },
    { day: "Sun", words: 6, quiz: 50 }
  ];
  return (
    <div className="card">
      <h3 className="font-semibold text-lg">Weekly Progress</h3>
      <div className="h-72 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="words" dot={false} />
            <Line type="monotone" dataKey="quiz" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function App(){
  const [tab, setTab] = useState("home");
  const [targetBand, setTargetBand] = useState(5);
  const [streak, setStreak] = useLocalStorage("els_streak", 1);
  const [store, setStore] = useLocalStorage("els_store", { words: DEFAULT_WORDS });

  useEffect(()=>{
    const key = "els_last_login";
    const last = localStorage.getItem(key);
    const today = new Date().toDateString();
    if(last !== today){
      setStreak(s=> s+1);
      localStorage.setItem(key, today);
    }
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((err)=>console.log("SW reg failed", err));
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 text-slate-900 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <Header targetBand={targetBand} setTargetBand={setTargetBand} />

        <div className="grid sm:grid-cols-[220px,1fr] gap-4">
          <Sidebar tab={tab} setTab={setTab} />
          <div className="space-y-4">
            {tab === "home" && <HomeDash streak={streak} setShowAddWord={()=>{}} />}
            {tab === "vocab" && <VocabTrainer store={store} setStore={setStore} />}
            {tab === "quiz" && <Quiz store={store} />}
            {tab === "listening" && <ListeningLab />}
            {tab === "writing" && <WritingCoach targetBand={targetBand} />}
            {tab === "progress" && <ProgressView history={[]} />}
          </div>
        </div>

        <footer className="text-center text-xs text-slate-500 py-6">
          Built with ❤️ for daily, focused practice. Modules: Vocab • Listening • Writing • Quiz • Progress
        </footer>
      </div>
    </div>
  );
}

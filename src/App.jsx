import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue, serverTimestamp, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCiFTsc-mlhMdl2ZiM5xApmKKJju-o1JOg",
  authDomain: "nishnihon-kaizen.firebaseapp.com",
  databaseURL: "https://nishnihon-kaizen-default-rtdb.firebaseio.com",
  projectId: "nishnihon-kaizen",
  storageBucket: "nishnihon-kaizen.firebasestorage.app",
  messagingSenderId: "322341504695",
  appId: "1:322341504695:web:f1e9458f741fa464286f32",
  measurementId: "G-VZEHVDKEGN"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const PASSCODE = "kaizen2024";
const ADMIN_PASSCODE = "kaizen2024";

const CATEGORIES = ["すべて", "AI活用", "販促・ポップ", "商品開発・レシピ", "オリジナルメニュー", "教育・人材育成", "清掃・オペレーション", "成果物・事例", "知識・ノウハウ"];

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "たった今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

function Avatar({ emoji, size = "md" }) {
  const s = size === "lg" ? "w-14 h-14 text-2xl" : size === "sm" ? "w-8 h-8 text-base" : "w-10 h-10 text-lg";
  return (
    <div className={`${s} rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0`}>
      {emoji || "🏪"}
    </div>
  );
}

function CategoryBadge({ label }) {
  const colors = {
    "AI活用": "bg-blue-100 text-blue-700",
    "販促・ポップ": "bg-pink-100 text-pink-700",
    "商品開発・レシピ": "bg-green-100 text-green-700",
    "オリジナルメニュー": "bg-yellow-100 text-yellow-700",
    "教育・人材育成": "bg-purple-100 text-purple-700",
    "清掃・オペレーション": "bg-gray-100 text-gray-700",
    "成果物・事例": "bg-orange-100 text-orange-700",
    "知識・ノウハウ": "bg-teal-100 text-teal-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[label] || "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
  );
}

function PostCard({ post, onClick, isAdmin, onDelete }) {
  const [liked, setLiked] = useState(false);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <div className="flex items-start gap-3">
        <Avatar emoji={post.avatar} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-gray-900">{post.store}</span>
            <CategoryBadge label={post.category} />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{timeAgo(post.createdAt)}</p>
          <h3 className="font-bold text-gray-900 mt-2 text-sm leading-snug">{post.title}</h3>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed line-clamp-3">{post.body}</p>
          {post.link && (
            <div className="mt-2">
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-lg inline-flex items-center gap-1">
                🔗 {post.linkLabel || post.link}
              </span>
            </div>
          )}
          <div className="flex items-center gap-4 mt-3">
            <button
              className={`flex items-center gap-1 text-sm ${liked ? "text-red-500" : "text-gray-400"}`}
              onClick={e => { e.stopPropagation(); setLiked(!liked); }}
            >
              {liked ? "❤️" : "🤍"} {(post.likes || 0) + (liked ? 1 : 0)}
            </button>
            {isAdmin && (
              <button
                className="flex items-center gap-1 text-sm text-red-400 hover:text-red-600"
                onClick={e => { e.stopPropagation(); onDelete(post); }}
              >
                🗑️ 削除
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PostForm({ onClose }) {
  const [step, setStep] = useState("auth");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    store: "", avatar: "🏪", category: "AI活用", title: "", body: "", link: "", linkLabel: ""
  });

  const AVATARS = ["🏪", "🍜", "🍖", "🥩", "🍣", "🍱", "🍛", "🍺", "📊", "⭐"];

  const handleAuth = () => {
    if (code === PASSCODE) {
      setStep("form");
    } else {
      setCodeError(true);
      setTimeout(() => setCodeError(false), 2000);
    }
  };

  const handleSubmit = async () => {
    if (!form.store || !form.title || !form.body) return;
    setSubmitting(true);
    try {
      await push(ref(db, "posts"), {
        ...form,
        likes: 0,
        createdAt: serverTimestamp(),
      });
      onClose();
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  if (step === "auth") return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
        <h2 className="text-lg font-bold text-gray-900 mb-1">投稿する</h2>
        <p className="text-sm text-gray-500 mb-4">投稿にはパスコードが必要です</p>
        <input
          className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${codeError ? "border-red-400" : "border-gray-200"}`}
          placeholder="パスコードを入力"
          type="password"
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAuth()}
        />
        {codeError && <p className="text-red-500 text-xs mt-1">パスコードが違います</p>}
        <button className="w-full mt-3 bg-orange-500 text-white font-bold py-3 rounded-xl disabled:opacity-40" disabled={code.length < 4} onClick={handleAuth}>
          確認
        </button>
        <button className="w-full mt-2 text-gray-400 text-sm py-2" onClick={onClose}>キャンセル</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
        <h2 className="text-lg font-bold text-gray-900 mb-4">改善事例を投稿</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">アイコン</p>
            <div className="flex gap-2 flex-wrap">
              {AVATARS.map(a => (
                <button key={a} className={`text-2xl p-1.5 rounded-xl ${form.avatar === a ? "bg-orange-100 ring-2 ring-orange-400" : ""}`} onClick={() => setForm({ ...form, avatar: a })}>{a}</button>
              ))}
            </div>
          </div>
          <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="店舗名 or お名前" value={form.store} onChange={e => setForm({ ...form, store: e.target.value })} />
          <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
          </select>
          <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="タイトル（例：クーポンGPTで反応2倍になった話）" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" rows={4} placeholder="どんな改善をした？結果は？" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
          <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="リンク（Notion・GPT・YouTubeなど、任意）" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} />
          {form.link && <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="リンクの名前（例：Notion手順書）" value={form.linkLabel} onChange={e => setForm({ ...form, linkLabel: e.target.value })} />}
          <button
            className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-40"
            disabled={!form.store || !form.title || !form.body || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "投稿中..." : "投稿する"}
          </button>
          <button className="w-full text-gray-400 text-sm py-2" onClick={onClose}>キャンセル</button>
        </div>
      </div>
    </div>
  );
}

// 管理者ログインモーダル
function AdminLogin({ onSuccess, onClose }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const handleAuth = () => {
    if (code === ADMIN_PASSCODE) {
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 mb-1">🔐 管理者モード</h2>
        <p className="text-sm text-gray-500 mb-4">パスコードを入力してください</p>
        <input
          className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 ${error ? "border-red-400" : "border-gray-200"}`}
          placeholder="パスコード"
          type="password"
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAuth()}
          autoFocus
        />
        {error && <p className="text-red-500 text-xs mt-1">パスコードが違います</p>}
        <button className="w-full mt-3 bg-red-500 text-white font-bold py-3 rounded-xl disabled:opacity-40" disabled={code.length < 4} onClick={handleAuth}>
          ログイン
        </button>
        <button className="w-full mt-2 text-gray-400 text-sm py-2" onClick={onClose}>キャンセル</button>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("timeline");
  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [showPostForm, setShowPostForm] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const postsRef = ref(db, "posts");
    const unsub = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setPosts(list);
      } else {
        setPosts([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (post) => {
    setDeleteTarget(post);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await remove(ref(db, `posts/${deleteTarget.id}`));
    setDeleteTarget(null);
    setSelectedPost(null);
  };

  const filtered = selectedCategory === "すべて"
    ? posts
    : posts.filter(p => p.category === selectedCategory);

  const stores = [...new Map(posts.map(p => [p.store, p])).values()];

  return (
    <div className="min-h-screen bg-gray-50 font-sans max-w-lg mx-auto relative">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-orange-500 font-semibold tracking-wide">西日本エリア</div>
              <h1 className="text-xl font-black text-gray-900 leading-tight">現場改善SNS</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-sm" onClick={() => setShowPostForm(true)}>
                ＋ 投稿
              </button>
              {isAdmin ? (
                <button className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded-lg" onClick={() => setIsAdmin(false)}>
                  管理者OFF
                </button>
              ) : (
                <button className="text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded-lg" onClick={() => setShowAdminLogin(true)}>
                  🔐
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex border-b border-gray-100">
          {[{ key: "timeline", label: "タイムライン" }, { key: "stores", label: "店舗一覧" }].map(t => (
            <button key={t.key} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${tab === t.key ? "border-orange-500 text-orange-500" : "border-transparent text-gray-400"}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        {tab === "timeline" && (
          <div className="flex gap-2 overflow-x-auto px-4 py-3">
            {CATEGORIES.map(c => (
              <button key={c} className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${selectedCategory === c ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"}`} onClick={() => setSelectedCategory(c)}>
                {c}
              </button>
            ))}
          </div>
        )}
        {isAdmin && (
          <div className="bg-red-50 px-4 py-2 text-xs text-red-600 font-bold text-center">
            🔐 管理者モード ON — 全投稿の削除が可能です
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3">
        {tab === "timeline" && (
          <>
            {loading && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">⏳</div>
                <p className="text-sm">読み込み中...</p>
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm">まだ投稿がありません</p>
                <p className="text-xs mt-1">最初の改善事例を投稿しよう</p>
                <button className="mt-4 bg-orange-500 text-white text-sm font-bold px-6 py-2.5 rounded-xl" onClick={() => setShowPostForm(true)}>
                  投稿する
                </button>
              </div>
            )}
            {filtered.map(post => (
              <PostCard key={post.id} post={post} onClick={() => setSelectedPost(post)} isAdmin={isAdmin} onDelete={handleDelete} />
            ))}
          </>
        )}

        {tab === "stores" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 px-1">投稿実績 {stores.length}店舗</p>
            {stores.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">🏪</div>
                <p className="text-sm">まだ投稿した店舗がありません</p>
              </div>
            )}
            {stores.map((store, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                <Avatar emoji={store.avatar} size="lg" />
                <div className="flex-1">
                  <div className="font-bold text-gray-900">{store.store}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{store.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-orange-500">{posts.filter(p => p.store === store.store).length}</div>
                  <div className="text-xs text-gray-400">投稿</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post detail */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setSelectedPost(null)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center gap-3 mb-3">
              <Avatar emoji={selectedPost.avatar} />
              <div>
                <div className="font-bold text-gray-900">{selectedPost.store}</div>
                <div className="text-xs text-gray-400">{timeAgo(selectedPost.createdAt)}</div>
              </div>
              <div className="ml-auto"><CategoryBadge label={selectedPost.category} /></div>
            </div>
            <h2 className="text-lg font-black text-gray-900 mb-3">{selectedPost.title}</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{selectedPost.body}</p>
            {selectedPost.link && (
              <div className="mt-4">
                <a href={selectedPost.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2.5" onClick={e => e.stopPropagation()}>
                  <span>🔗</span>
                  <span className="text-sm text-orange-600 font-medium">{selectedPost.linkLabel || selectedPost.link}</span>
                </a>
              </div>
            )}
            {isAdmin && (
              <button className="w-full mt-4 bg-red-50 text-red-500 font-bold py-2.5 rounded-xl text-sm" onClick={() => handleDelete(selectedPost)}>
                🗑️ この投稿を削除する
              </button>
            )}
            <button className="w-full mt-2 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl text-sm" onClick={() => setSelectedPost(null)}>
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <p className="font-bold text-gray-900 mb-1">この投稿を削除しますか？</p>
            <p className="text-sm text-gray-500 mb-1">「{deleteTarget.title}」</p>
            <p className="text-xs text-red-500 mb-4">※ 削除すると元に戻せません</p>
            <div className="flex gap-2">
              <button className="flex-1 bg-gray-100 text-gray-600 font-bold py-2.5 rounded-xl text-sm" onClick={() => setDeleteTarget(null)}>
                キャンセル
              </button>
              <button className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm" onClick={confirmDelete}>
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {showPostForm && <PostForm onClose={() => setShowPostForm(false)} />}
      {showAdminLogin && <AdminLogin onSuccess={() => { setIsAdmin(true); setShowAdminLogin(false); }} onClose={() => setShowAdminLogin(false)} />}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-100 flex">
        {[
          { key: "timeline", icon: "🏠", label: "ホーム" },
          { key: "stores", icon: "🏪", label: "店舗" },
        ].map(n => (
          <button key={n.key} className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-xs ${tab === n.key ? "text-orange-500" : "text-gray-400"}`} onClick={() => setTab(n.key)}>
            <span className="text-xl">{n.icon}</span>
            {n.label}
          </button>
        ))}
      </div>
      <div className="h-20" />
    </div>
  );
}

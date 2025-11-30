export const rangeData = {
  open_ranges: {
    ep_open: ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "AKs", "AQs", "AJs", "ATs", "A9s", "A5s", "A4s", "A3s", "AKo", "AQo", "KQs", "KJs", "KTs", "K9s", "QJs", "QTs", "Q9s", "JTs", "J9s", "T9s", "98s", "87s", "76s", "65s"],
    hj_open: ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s", "AKo", "AQo", "AJo", "ATo", "KQs", "KJs", "KTs", "K9s", "K8s", "K7s", "KQo", "KJo", "QJs", "QTs", "Q9s", "Q8s", "JTs", "J9s", "J8s", "T9s", "T8s", "98s", "87s", "76s", "65s", "54s"],
    // CO open - wider than HJ, tighter than BTN
    co_open: ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22", "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s", "AKo", "AQo", "AJo", "ATo", "A9o", "KQs", "KJs", "KTs", "K9s", "K8s", "K7s", "K6s", "K5s", "KQo", "KJo", "KTo", "QJs", "QTs", "Q9s", "Q8s", "Q7s", "Q6s", "QJo", "QTo", "JTs", "J9s", "J8s", "J7s", "JTo", "T9s", "T8s", "T7s", "98s", "97s", "96s", "87s", "86s", "76s", "75s", "65s", "64s", "54s", "53s", "43s"],
    btn_open: ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22", "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s", "AKo", "AQo", "AJo", "ATo", "A9o", "A8o", "A7o", "A6o", "A5o", "A4o", "KQs", "KJs", "KTs", "K9s", "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "K2s", "KQo", "KJo", "KTo", "K9o", "K8o", "QJs", "QTs", "Q9s", "Q8s", "Q7s", "Q6s", "Q5s", "Q4s", "Q3s", "Q2s", "QJo", "QTo", "Q9o", "JTs", "J9s", "J8s", "J7s", "J6s", "J5s", "JTo", "J9o", "T9s", "T8s", "T7s", "T6s", "T9o", "T8o", "98s", "97s", "96s", "98o", "87s", "86s", "85s", "76s", "75s", "74s", "65s", "64s", "54s", "53s", "43s"],
    // SB open (steal) - very wide, only BB to get through. Include more suited gappers and offsuit broadways.
    sb_open: ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22", "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s", "AKo", "AQo", "AJo", "ATo", "A9o", "A8o", "A7o", "A6o", "A5o", "A4o", "A3o", "A2o", "KQs", "KJs", "KTs", "K9s", "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "K2s", "KQo", "KJo", "KTo", "K9o", "K8o", "K7o", "K6o", "K5o", "K4o", "QJs", "QTs", "Q9s", "Q8s", "Q7s", "Q6s", "Q5s", "Q4s", "Q3s", "Q2s", "QJo", "QTo", "Q9o", "Q8o", "Q7o", "Q6o", "JTs", "J9s", "J8s", "J7s", "J6s", "J5s", "J4s", "J3s", "JTo", "J9o", "J8o", "J7o", "T9s", "T8s", "T7s", "T6s", "T5s", "T4s", "T9o", "T8o", "T7o", "98s", "97s", "96s", "95s", "94s", "98o", "97o", "87s", "86s", "85s", "84s", "87o", "86o", "76s", "75s", "74s", "73s", "76o", "65s", "64s", "63s", "65o", "54s", "53s", "52s", "54o", "43s", "42s", "32s"],
    btn_vs_limp: ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22", "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s", "AKo", "AQo", "AJo", "ATo", "KQs", "KJs", "KTs", "K9s", "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "K2s", "KQo", "QJs", "QTs", "Q9s", "Q8s", "JTs", "J9s", "J8s", "T9s", "T8s", "98s", "97s", "87s", "86s", "76s", "75s", "65s", "54s"],
    btn_vs_2_fish: ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22", "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s", "AKo", "AQo", "AJo", "ATo", "A9o", "A8o", "A7o", "A6o", "A5o", "A4o", "A3o", "A2o", "KQs", "KJs", "KTs", "K9s", "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "K2s", "KQo", "KJo", "KTo", "K9o", "K8o", "K7o", "K6o", "K5o", "K4o", "K3o", "K2o", "QJs", "QTs", "Q9s", "Q8s", "Q7s", "Q6s", "Q5s", "Q4s", "Q3s", "Q2s", "QJo", "QTo", "Q9o", "Q8o", "Q7o", "Q6o", "Q5o", "Q4o", "Q3o", "JTs", "J9s", "J8s", "J7s", "J6s", "J5s", "J4s", "J3s", "J2s", "JTo", "J9o", "J8o", "J7o", "J6o", "J5o", "J4o", "T9s", "T8s", "T7s", "T6s", "T5s", "T4s", "T3s", "T2s", "T9o", "T8o", "T7o", "T6o", "T5o", "98s", "97s", "96s", "95s", "94s", "93s", "92s", "98o", "97o", "96o", "95o", "87s", "86s", "85s", "84s", "83s", "82s", "87o", "86o", "85o", "76s", "75s", "74s", "73s", "72s", "76o", "75o", "65s", "64s", "63s", "62s", "65o", "64o", "54s", "53s", "52s", "54o", "53o", "43s", "43o", "42s", "32s"]
  },
  vs_open_ranges: {
    hj_vs_ep_open: {
      "3bet": ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "AKs", "AQs", "AJs", "ATs", "A9s", "A5s", "A4s", "A3s", "AKo", "AQo", "KQs", "KJs", "KTs", "QJs", "QTs", "JTs"],
      call: []
    },
    btn_vs_aggro_open: {
      "3bet": ["AA", "AKs", "AJs", "ATs", "A9s", "A8s", "A3s", "A2s", "AKo", "AQo", "AJo", "ATo", "KK", "KQs", "KJs", "KTs", "K9s", "K8s", "KQo", "KJo", "KTo", "QQ", "QJs", "QTs", "JJ", "JTs", "J9s", "TT", "T9s", "33"],
      call: ["AQs", "A7s", "A6s", "A5s", "A4s", "K6s", "Q9s", "J8s", "T8s", "99", "98s", "88", "87s", "77", "76s", "66", "65s", "55", "54s", "44", "22"],
      mixed: ["A7s", "A6s", "A5s", "A4s", "K6s", "Q9s", "J8s", "T8s", "99", "98s", "88", "87s", "77", "76s", "66", "65s", "55", "54s", "44", "33", "22"]
    },
    btn_vs_passive_open: {
      "3bet": ["AA", "KK", "AKs", "AKo", "AQs", "AJs"],
      call: ["QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22", "ATs", "A5s", "A4s", "KQs", "KJs", "KTs", "QJs", "JTs", "T9s", "65s", "54s"],
      mixed: ["AKs", "KK", "QQ", "ATs"]
    },
    bb_vs_passive_open: {
      "3bet": ["AA", "KK", "AKs", "AKo", "AQs", "AQo", "AJs"],
      call: ["QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22", "ATs", "A9s", "A5s", "KQs", "KJs", "KTs", "QJs", "QTs", "Q9s", "JTs", "J9s", "T9s", "98s", "87s", "86s", "76s", "75s", "65s", "64s", "54s", "53s", "43s"],
      mixed: ["KK", "AKs", "AJs"]
    },
    bb_vs_aggro_open: {
      "3bet": ["AA", "AQs", "ATs", "A7s", "A4s", "AKo", "KK", "KQs", "K9s", "K5s", "K3s", "KQo", "KJo", "QQ", "QTs", "Q8s", "Q6s", "Q4s", "QJo", "JJ", "J9s", "J7s", "JTo", "AJo", "ATo", "KTo", "QTo", "TT", "T8s", "T6s", "A9o", "J9o", "T9o", "99", "97s", "98o", "77", "75s", "66", "64s", "55", "53s", "44", "42s", "33", "22"],
      call: ["AKs", "AJs", "A9s", "A8s", "A6s", "A5s", "A3s", "A2s", "KJs", "KTs", "K8s", "K7s", "K6s", "K4s", "K2s", "KTo", "QJs", "Q9s", "Q7s", "Q5s", "JTs", "J8s", "J6s", "T9s", "T7s", "88", "98s", "96s", "87s", "86s", "85s", "76s", "74s", "65s", "63s", "54s", "43s", "32s"],
      mixed: ["AQs", "ATs", "A7s", "A4s", "KQs", "K9s", "K5s", "K3s", "QTs", "Q8s", "Q6s", "Q4s", "J9s", "J7s", "T8s", "T6s", "99", "97s", "77", "75s", "66", "64s", "55", "53s", "44", "42s", "33", "22"]
    },
    btn_squeeze: {
      "3bet": ["AA", "AKs", "AQs", "AJs", "ATs", "A8s", "A7s", "A5s", "A3s", "A2s", "AKo", "AQo", "KK", "KQs", "KJs", "KTs", "K9s", "K8s", "KQo", "QQ", "QJs", "QTs", "AJo", "KJo", "JJ", "JTs", "J9s", "TT", "T9s", "99", "98s", "88", "87s", "44", "33", "22"],
      call: ["A9s", "A6s", "A4s", "Q9s", "77", "76s", "66", "65s", "55"],
      mixed: ["A9s", "A6s", "A4s", "Q9s", "QTs", "J9s", "T9s", "99", "98s", "88", "87s", "77", "76s", "66", "65s", "55"]
    },
    ep_vs_pro_open: {
      "3bet": ["AA", "AKs", "AJs", "ATs", "A5s", "AKo", "KK", "KQs", "KJs", "QQ", "QJs", "JJ"],
      call: ["AQs", "JTs", "TT", "99", "88", "77"]
    },
    btn_vs_co_pro_open: {
      "3bet": ["AA", "AKs", "AJs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s", "AKo", "AQo", "AJo", "KK", "KQs", "KJs", "KTs", "K9s", "KQo", "QQ", "QJs", "QTs", "Q9s", "JJ", "JTs", "J9s", "TT", "T9s", "99", "98s", "87s"],
      call: ["AQs", "ATs", "88", "77", "76s", "66", "65s", "55", "44", "33", "22"],
      mixed: ["AQs", "ATs", "99", "98s", "88", "87s"]
    },
    // BTN vs EP open - respect the tight EP range, need strong hands
    btn_vs_ep_open: {
      "3bet": ["AA", "KK", "QQ", "JJ", "AKs", "AQs", "AJs", "AKo", "AQo"],
      call: ["TT", "99", "88", "77", "66", "ATs", "A5s", "KQs", "KJs", "QJs", "JTs", "T9s", "98s", "87s", "76s", "65s", "54s"],
      mixed: ["JJ", "AJs", "AQo"]
    },
    // CO vs HJ open - positional battle between regs
    co_vs_hj_open: {
      "3bet": ["AA", "KK", "QQ", "JJ", "AKs", "AQs", "AJs", "A5s", "A4s", "AKo", "AQo", "KQs", "KJs"],
      call: ["TT", "99", "88", "77", "66", "55", "ATs", "A9s", "KTs", "K9s", "QJs", "QTs", "JTs", "J9s", "T9s", "98s", "87s", "76s", "65s", "54s"],
      mixed: ["JJ", "AJs", "A5s", "KJs", "TT"]
    },
    // BB vs SB open (steal defense) - wide defense since SB opens wide, we have position postflop
    bb_vs_sb_open: {
      "3bet": ["AA", "KK", "QQ", "JJ", "TT", "99", "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A5s", "A4s", "A3s", "AKo", "AQo", "AJo", "KQs", "KJs", "KTs", "K9s", "KQo", "QJs", "QTs", "JTs", "J9s", "T9s", "98s", "87s"],
      call: ["88", "77", "66", "55", "44", "33", "22", "A7s", "A6s", "A2s", "ATo", "A9o", "A8o", "A7o", "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "K2s", "KJo", "KTo", "K9o", "Q9s", "Q8s", "Q7s", "Q6s", "Q5s", "Q4s", "QJo", "QTo", "J8s", "J7s", "J6s", "JTo", "J9o", "T8s", "T7s", "T6s", "T9o", "97s", "96s", "86s", "85s", "76s", "75s", "74s", "65s", "64s", "54s", "53s", "43s"],
      mixed: ["99", "88", "A9s", "A8s", "A5s", "A4s", "A3s", "K9s", "QTs", "J9s", "T9s", "98s", "87s"]
    },
    // SB 3bet vs BTN steal - aggressive 3bet range since BTN opens wide
    sb_3bet_vs_btn: {
      "3bet": ["AA", "KK", "QQ", "JJ", "TT", "99", "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A7s", "A5s", "A4s", "A3s", "A2s", "AKo", "AQo", "AJo", "ATo", "KQs", "KJs", "KTs", "K9s", "K8s", "KQo", "KJo", "QJs", "QTs", "Q9s", "JTs", "J9s", "T9s", "98s", "87s", "76s", "65s"],
      call: [],
      mixed: ["99", "A9s", "A8s", "A7s", "A5s", "A4s", "A3s", "A2s", "K9s", "K8s", "Q9s", "J9s", "T9s", "98s", "87s", "76s", "65s"]
    },
    // BB squeeze vs BTN open + SB call - punish dead money
    bb_squeeze: {
      "3bet": ["AA", "KK", "QQ", "JJ", "TT", "99", "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A5s", "A4s", "A3s", "AKo", "AQo", "AJo", "KQs", "KJs", "KTs", "K9s", "KQo", "QJs", "QTs", "JTs", "J9s", "T9s", "98s", "87s", "76s"],
      call: ["88", "77", "66", "55", "44", "33", "22", "A7s", "A6s", "A2s", "K8s", "K7s", "Q9s", "Q8s", "J8s", "T8s", "97s", "86s", "75s", "65s", "54s"],
      mixed: ["99", "A9s", "A8s", "A5s", "A4s", "A3s", "K9s", "J9s", "T9s", "98s", "87s", "76s"]
    }
  },
  vs_3bet_ranges: {
    oop_vs_passive_3bet: {
      "4bet": ["AA", "KK", "AKs", "AKo"],
      call: ["QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22", "AQs", "AJs", "ATs", "A9s", "KQs", "KJs", "KTs", "QJs", "QTs", "Q9s", "JTs", "J9s", "T9s", "T8s", "98s", "87s", "76s", "65s", "54s", "43s"],
      mixed: ["KK", "AKs", "QQ", "AJs"]
    },
    oop_vs_aggro_3bet: {
      "4bet": ["AA", "KK", "QQ", "JJ", "TT", "AKs", "AJs", "ATs", "A5s", "AKo", "AQo", "KQo"],
      call: ["AQs", "A9s", "KQs", "KJs", "KTs", "QJs", "QTs", "Q9s", "JTs", "J9s", "T9s", "T8s", "99", "98s", "88", "87s", "77", "76s", "66", "65s", "55", "54s", "44", "43s", "33", "22"],
      mixed: ["AKs", "AJs", "ATs", "A9s", "KJs", "KTs", "QJs", "QTs", "TT", "99"]
    },
    ip_vs_passive_3bet: {
      "4bet": ["AA", "KK", "AKs", "AKo", "AQo", "A5s"],
      call: ["QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22", "AQs", "AJs", "ATs", "A9s", "KQs", "KJs", "KTs", "QJs", "QTs", "Q9s", "JTs", "J9s", "T9s", "T8s", "98s", "87s", "76s", "75s", "65s", "64s", "54s", "53s", "43s"],
      mixed: ["KK", "AKs", "ATs", "A9s", "KJs", "KTs", "TT", "87s"]
    },
    ip_vs_aggro_3bet: {
      "4bet": ["AA", "KK", "AKs", "AKo"],
      call: ["QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22", "AQs", "AJs", "ATs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s", "AQo", "AJo", "ATo", "KQs", "KJs", "KTs", "K9s", "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "KQo", "KJo", "QJs", "QTs", "Q9s", "Q8s", "QJo", "JTs", "J9s", "J8s", "T9s", "T8s", "T7s", "98s", "97s", "96s", "87s", "86s", "76s", "75s", "65s", "64s", "54s", "53s", "43s"],
      mixed: ["KK", "AKs", "AKo", "A7s", "KQo", "JJ", "87s"]
    },
    // SB vs BB 3bet after SB opened - very tough spot, OOP entire hand with wide open range facing 3bet
    sb_vs_bb_3bet: {
      "4bet": ["AA", "KK", "QQ", "AKs", "AKo"],
      call: ["JJ", "TT", "99", "88", "77", "66", "AQs", "AJs", "ATs", "A9s", "A5s", "KQs", "KJs", "KTs", "QJs", "QTs", "JTs", "J9s", "T9s", "98s", "87s", "76s", "65s", "54s"],
      mixed: ["QQ", "JJ", "AQs", "AJs", "A5s", "KQs"]
    }
  },
  cold_4bet_ranges: {
    // OOP cold 4bet vs tight (tighter range when out of position)
    oop_cold_4bet_vs_tight: {
      "4bet": ["AA", "KK", "QQ", "AKs"]
    },
    // IP cold 4bet vs tight (AA, KK, QQ, AKs, AKo, JJ all pure 4bet when IP)
    ip_cold_4bet_vs_tight: {
      "4bet": ["AA", "KK", "QQ", "AKs", "AKo", "JJ"]
    },
    // OOP cold 4bet vs aggro
    oop_cold_4bet_vs_aggro: {
      "4bet": ["AA", "KK", "QQ", "JJ", "TT", "AKs", "AQs", "AKo", "KQs"]
    },
    // IP cold 4bet vs aggro (can add AQo, AJs, KJs, A5s when in position)
    ip_cold_4bet_vs_aggro: {
      "4bet": ["AA", "KK", "QQ", "JJ", "TT", "AKs", "AQs", "AKo", "KQs", "AQo", "AJs", "KJs", "A5s"],
      mixed: ["AQo", "AJs", "KJs", "A5s"]
    }
  },
  vs_4bet_ranges: {
    oop_vs_passive_4bet: {
      "5bet": ["AA", "KK", "AKs"],
      call: ["QQ", "JJ", "TT", "AKo"],
      mixed: ["KK", "AKs"]
    },
    ip_vs_passive_4bet: {
      "5bet": ["AA", "AKs"],
      call: ["KK", "QQ", "JJ", "TT", "AKo"],
      mixed: ["KK", "AKs"]
    },
    oop_vs_aggro_4bet: {
      "5bet": ["AA", "KK"],
      call: ["QQ", "AKs", "AKo"],
      mixed: ["KK"]
    },
    ip_vs_aggro_4bet: {
      "5bet": ["AA"],
      call: ["KK", "QQ", "JJ", "TT", "AKs", "AKo", "87s", "76s", "65s", "54s"],
      mixed: ["KK", "AKs"]
    }
  }
};

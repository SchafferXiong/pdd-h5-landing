window.__LP_CONFIG_V2_3 = {
  source: {
    pageUrl: 'https://app.mi.com/details?id=com.aliyun.tongyi',
    packageName: 'com.aliyun.tongyi',
    fetchDate: '2026-03-03'
  },
  brand: {
    name: '千问',
    subName: '阿里AI助手',
    slogan: 'AI办公助手',
    logoUrl: '../../input/visuals/qianwen/logo.png'
  },
  cta: {
    text: '立即下载 千问',
    sub: '下一份任务，10分钟交付',
    androidUrl: 'https://app.mi.com/details?id=com.aliyun.tongyi'
  },
  visuals: {
    stageImage: '../../input/visuals/qianwen/shot2.jpg',
    optionalVideo: {
      src: '',
      poster: '',
      mode: 'background'
    }
  },
  narrative: {
    hook: {
      title: '你的下一份工作任务，10分钟交付',
      sub: '从周报到PPT，再到调研，一次交给千问。'
    },
    engage: {
      button: '启动10分钟模式',
      hint: '点一下，马上看结果如何生成'
    },
    demo: {
      running: '千问正在生成可交付结果',
      done: '结果已就绪，直接进入高效办公'
    },
    convert: {
      title: '下载千问，立即进入AI办公模式',
      sub: '打开就能开始下一份任务'
    }
  },
  benefits: [
    {
      title: '结构化输出',
      desc: '结论、提纲、正文直接可交付，不再反复返工。'
    },
    {
      title: '连续可编辑',
      desc: '同一会话持续修改，保留上下文，交付更快。'
    },
    {
      title: '场景覆盖广',
      desc: '周报、PPT、调研分析都可直接接管处理。'
    }
  ],
  scenarios: [
    {
      id: 'report',
      name: '周报',
      beforeMin: 64,
      afterMin: 10,
      tasks: ['整理会议记录', '生成周报结构', '输出可发版正文']
    },
    {
      id: 'ppt',
      name: 'PPT',
      beforeMin: 72,
      afterMin: 12,
      tasks: ['提炼汇报主线', '自动生成页纲', '输出可演示版本']
    },
    {
      id: 'analysis',
      name: '调研',
      beforeMin: 55,
      afterMin: 9,
      tasks: ['检索关键信息', '提炼证据观点', '生成决策建议稿']
    }
  ],
  motion: {
    tier: 'high',
    useGsap: false,
    useViewTransitionsWhenSupported: true
  },
  copyGuard: {
    bannedPhrases: ['看到叙事', '叙事 -> 参与 -> 演示 -> 下载按钮', '设计思路', '方法论', '状态机', '节拍', '流程说明'],
    bannedPatterns: ['->', '=>', '→'],
    action: 'block_publish'
  }
};

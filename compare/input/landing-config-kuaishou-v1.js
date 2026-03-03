window.__LP_CONFIG = {
  brand: {
    name: '快手极速版',
    logoUrl: '../../input/visuals/kuaishou/logo.png',
    slogan: '看视频 领现金',
    colors: {
      primary: '#ff4a24',
      secondary: '#ff7a1f',
      accent: '#ffd04f'
    }
  },
  visuals: {
    hero: '../../input/visuals/kuaishou/shot1.jpg',
    scenes: [
      '../../input/visuals/kuaishou/shot2.jpg',
      '../../input/visuals/kuaishou/shot3.jpg',
      '../../input/visuals/kuaishou/shot4.jpg',
      '../../input/visuals/kuaishou/shot5.jpg'
    ],
    stickers: ['../../input/visuals/kuaishou/logo.png'],
    bgTexture: '../../input/visuals/bg_texture_redgold.jpg'
  },
  benefits: [
    '看视频 领金币 / 零门槛 躺着赚钱',
    '邀好友 领现金 / 好友扫一扫 提现秒到账',
    '全币兑优惠 / 低价好物 一省再省',
    '喂鸭鸭 得现金 / 喂鸭集鸭蛋 孵蛋换大钱',
    '各种任务赚不停 / 狂赚金币 快速提现'
  ],
  timing: {
    heroBeats: [
      { start: 0.0, end: 0.9, title: '看视频 领金币', sub: '零门槛 躺着赚钱', ctaLevel: 0, visualKey: 'hero' },
      { start: 0.9, end: 2.1, title: '邀好友 领现金', sub: '好友扫一扫 提现秒到账', ctaLevel: 1, visualKey: 'scene1' },
      { start: 2.1, end: 3.3, title: '全币兑优惠', sub: '低价好物 一省再省', ctaLevel: 1, visualKey: 'scene2' },
      { start: 3.3, end: 4.0, title: '立即下载', sub: '限时福利 现在解锁', ctaLevel: 2, visualKey: 'scene4' }
    ],
    storyBeats: [
      { start: 0.0, end: 2.6, title: '喂鸭鸭 得现金', sub: '喂鸭集鸭蛋 孵蛋换大钱', ctaLevel: 1, visualKey: 'scene3' },
      { start: 2.6, end: 5.3, title: '各种任务赚不停', sub: '狂赚金币 快速提现', ctaLevel: 1, visualKey: 'scene4' },
      { start: 5.3, end: 8.0, title: '邀好友 领现金', sub: '好友扫一扫 提现秒到账', ctaLevel: 2, visualKey: 'scene1' }
    ]
  },
  conversion: {
    rewardAmount: '38.88',
    countdownSec: 240,
    progressTargetPct: 86,
    feed: [
      { nameMask: '郑**', action: '刚提现成功', amount: '+¥22.88' },
      { nameMask: '林**', action: '完成任务领奖励', amount: '+¥16.50' },
      { nameMask: '王**', action: '邀请好友到账', amount: '+¥38.00' },
      { nameMask: '周**', action: '看视频领金币', amount: '+1200币' },
      { nameMask: '陈**', action: '兑换好物成功', amount: '省¥31.20' }
    ]
  },
  cta: {
    text: '立即下载快手极速版',
    androidUrl: 'https://app.mi.com/details?id=com.kuaishou.nebula'
  },
  layout: {
    safeTop: 12,
    safeBottom: 108,
    heroMinH: '70vh',
    cardMinH: 88,
    maxCopyLines: 2
  }
};

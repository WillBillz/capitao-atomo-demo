export const CAPTAIN_MESSAGES=[
  'Obrigado pela sua ajuda! Juntos, recuperamos parte das possibilidades deste mundo.',
  'Mas ainda há muito a ser feito. Muitos caminhos continuam presos aos cálculos do Dr. Certeza.',
  'Conto com você nas próximas aventuras! Vamos continuar juntos até que as possibilidades possam voltar.'
];
export const beginCaptainConversation=()=>({open:true,step:0});
export function advanceCaptainConversation(state){if(!state?.open)return state;return state.step>=CAPTAIN_MESSAGES.length-1?{...state,open:false}:{open:true,step:state.step+1};}
export function captainMessage(state){return state?.open?CAPTAIN_MESSAGES[Math.max(0,Math.min(CAPTAIN_MESSAGES.length-1,state.step??0))]:'';}
// Crop the approved painted head. Gentle nodding does not fabricate speech or lip sync.
export function drawCaptainPortrait(c,image,time=0){
  c.clearRect(0,0,160,160);if(!image)return;c.save();const g=c.createRadialGradient(65,58,5,80,80,76);g.addColorStop(0,'#466a88');g.addColorStop(1,'#142a46');c.fillStyle=g;c.strokeStyle='#e5c786';c.lineWidth=3;c.beginPath();c.arc(80,80,75,0,Math.PI*2);c.fill();c.stroke();
  c.translate(80,80+Math.sin(time*1.5)*1.5);c.rotate(Math.sin(time*1.1)*.025);c.translate(-365,-88);c.beginPath();[[299,39],[332,25],[409,25],[434,50],[430,103],[407,136],[377,150],[344,148],[313,130],[296,93]].forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();c.drawImage(image,0,0,460,455,0,0,460,455);c.restore();
}

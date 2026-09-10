"""Figures from final matched-network measurements; no invented preference score."""
import csv,json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch,FancyArrowPatch
from matplotlib.lines import Line2D
from matplotlib.backends.backend_pdf import PdfPages

out=Path(__file__).parent;rows=json.loads((out.parent/'bounded-route-results.json').read_text())['results']
ink='#20343b';muted='#63747a';male='#187d70';female='#a54e74';paper='#fbfcfa';line='#dce3df'
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'text.color':ink,'axes.labelcolor':ink,'xtick.color':ink,'ytick.color':muted,'axes.edgecolor':line,'svg.fonttype':'none','savefig.facecolor':paper})
fig,axs=plt.subplots(1,2,figsize=(12.8,6.8),facecolor=paper)
fig.subplots_adjust(left=.08,right=.90,top=.74,bottom=.23,wspace=.40)
fig.text(.055,.94,'Both responses rise. The female-cue response stays stronger.',fontsize=20,weight='bold')
fig.text(.055,.89,'Recorded activity in the full-connectome model — no mating-choice rule was used.',fontsize=11,color=muted)
legend=[Line2D([0],[0],color=male,marker='o',lw=2,label='Candidate male cue'),Line2D([0],[0],color=female,marker='o',lw=2,label='Candidate female cue')]
fig.legend(handles=legend,loc='upper left',bbox_to_anchor=(.05,.855),ncol=2,frameon=False,fontsize=11)
ratios=[]
for ax,ei,letter in zip(axs,[-70,-80],['A','B']):
 ax.set_facecolor(paper);ax.set_title(f'Check {letter}  ·  inhibitory reversal {ei} mV',loc='left',fontsize=12,pad=16)
 means={}
 for pop,color,shift,label in [('candidate_male',male,-.075,'Male'),('candidate_female',female,.075,'Female')]:
  vals=[]
  for j,seed in enumerate([11,12,13]):
   y=[next(r['P1_spikes'] for r in rows if r['reversal_mV']==ei and r['input']==pop and r['seed']==seed and r['condition']==c) for c in ['intact','mAL_blocked']]
   vals.append(y);x=np.array([0,1])+shift+(j-1)*.025
   ax.plot(x,y,color=color,alpha=.35,lw=1,zorder=2);ax.scatter(x,y,s=32,color=color,alpha=.65,zorder=3,edgecolors=paper,linewidths=.6)
  mean=np.mean(vals,axis=0);means[pop]=mean
  ax.plot(np.array([0,1])+shift,mean,color=color,lw=2.7,zorder=4)
  ax.scatter(np.array([0,1])+shift,mean,s=65,marker='D',color=color,edgecolors=paper,linewidths=1,zorder=5)
  ax.text(1.17,float(mean[1]),f'{label}\n{mean[1]:.1f}',color=color,fontsize=11,va='center',weight='bold')
 ax.set_xlim(-.25,1.62);ax.set_ylim(-1.3,25.5);ax.set_xticks([0,1],['Brake intact','mAL output\nblocked']);ax.tick_params(axis='x',length=0,pad=10)
 ax.set_yticks([0,5,10,15,20,25]);ax.grid(axis='y',color=line,lw=.8,zorder=0)
 for side in ['top','right','left']:ax.spines[side].set_visible(False)
 ax.tick_params(axis='y',length=0)
 ratios.append(means['candidate_female'][1]/means['candidate_male'][1])
axs[0].set_ylabel('Spikes across 8 readout neurons\n(250 ms response window)',labelpad=12)
fig.text(.055,.105,f'After mAL block, the mean female-cue response was {min(ratios):.1f}–{max(ratios):.1f}× the male-cue response.',fontsize=12,weight='bold')
fig.text(.055,.052,'Small circles: three fresh random seeds. Diamonds: means. Lines pair identical inputs before/after the block.\nThis measures modeled neural responsiveness, not the probability of choosing a mate; transmitter signs remain assumptions.',fontsize=9.5,color=muted,linespacing=1.6)
fig.savefig(out/'cue-response-comparison.png',dpi=180);fig.savefig(out/'cue-response-comparison.svg')

f2=plt.figure(figsize=(12.8,7.2),facecolor=paper);a=f2.add_axes([0,0,1,1]);a.set_xlim(0,1);a.set_ylim(0,1);a.axis('off')
f2.text(.055,.935,'What did we change — and what did we measure?',fontsize=21,weight='bold')
f2.text(.055,.883,'The same network and input signal were tested twice. Only mAL output transmission changed.',fontsize=11,color=muted)
def box(x,y,w,h,text,face='#eef3f0',edge=line,size=12,color=ink):
 a.add_patch(FancyBboxPatch((x,y),w,h,boxstyle='round,pad=.012,rounding_size=.015',facecolor=face,edgecolor=edge,lw=1))
 a.text(x+w/2,y+h/2,text,ha='center',va='center',fontsize=size,color=color,linespacing=1.6)
def arrow(x1,y1,x2,y2,color=muted):
 a.add_patch(FancyArrowPatch((x1,y1),(x2,y2),arrowstyle='-|>',mutation_scale=17,lw=1.7,color=color))
for x,label in [(.055,'INPUT'),(.395,'INTERVENTION'),(.735,'MEASUREMENT')]:f2.text(x,.795,label,fontsize=10,color=muted,weight='bold')
box(.055,.49,.23,.23,'Artificial stimulation\nof candidate male\nor female sensory cells',size=13)
box(.395,.49,.23,.23,'Full connectome model\n166,606 neurons\n25.6 million connections',size=13)
box(.735,.49,.21,.23,'Count spikes in\n8 candidate P1 cells\nlinked to courtship',size=13)
arrow(.295,.605,.38,.605);arrow(.635,.605,.72,.605)
box(.355,.29,.13,.11,'mAL intact',face='#e9efec',size=12)
box(.535,.29,.13,.11,'mAL output\nblocked',face='#e3f1eb',edge=male,size=12,color=male)
a.plot([.51,.51],[.49,.445],color=muted,lw=1.2);a.plot([.42,.60],[.445,.445],color=muted,lw=1.2);arrow(.42,.445,.42,.405);arrow(.60,.445,.60,.405)
f2.text(.055,.38,'Matched inputs in each pair.\nNo direct stimulation of P1\nin this sensory experiment.',fontsize=11,color=muted,linespacing=1.6)
f2.text(.735,.38,'Male-cue response:\n0 spikes → 1–7 spikes\nacross the final checks.',fontsize=12,color=male,weight='bold',linespacing=1.6)
a.plot([.055,.945],[.225,.225],color=line,lw=1)
f2.text(.055,.18,'What this supports',fontsize=12,weight='bold')
f2.text(.055,.105,'Removing an inhibitory brake can reveal\na previously suppressed male-cue response.',fontsize=12,linespacing=1.5)
f2.text(.55,.18,'What it does not establish',fontsize=12,weight='bold')
f2.text(.55,.105,'A fly choosing males over females.\nFemale-cue responses remained stronger.',fontsize=12,linespacing=1.5)
f2.text(.055,.045,'Schematic, not an anatomical pathway map. Candidate identities, relay signs and neuron dynamics are modeled assumptions; see RESULTS.md.',fontsize=9,color=muted)
f2.savefig(out/'experiment-explained.png',dpi=180);f2.savefig(out/'experiment-explained.svg')
with PdfPages(out/'fruitless-experiment-figures.pdf') as pdf:pdf.savefig(fig);pdf.savefig(f2)
with (out/'figure-data.csv').open('w') as f:
 writer=csv.DictWriter(f,fieldnames=['reversal_mV','input','seed','condition','P1_spikes','events']);writer.writeheader()
 for r in rows:
  if r['input'] in ['candidate_male','candidate_female']:writer.writerow({k:r[k] for k in writer.fieldnames})
print('Saved two figures, vector originals, PDF and exact plotted data.')

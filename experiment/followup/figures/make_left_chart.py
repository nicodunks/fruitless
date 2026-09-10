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
fig,ax=plt.subplots(figsize=(7.5,6),facecolor=paper)
axs=[ax]
fig.subplots_adjust(left=.15,right=.94,top=.87,bottom=.14)
legend=[Line2D([0],[0],color=male,marker='o',lw=2,label='Candidate male cue'),Line2D([0],[0],color=female,marker='o',lw=2,label='Candidate female cue')]
fig.legend(handles=legend,loc='upper left',bbox_to_anchor=(.14,.98),ncol=2,frameon=False,fontsize=11)
ratios=[]
for ax,ei,letter in zip(axs,[-70],['A']):
 ax.set_facecolor(paper)
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
for extension in ['png','svg','pdf']:
 fig.savefig(out/f'cue-response-left.{extension}',dpi=200)

"""Independent behavioral checks on small networks before interpreting full-network output."""
import numpy as np
from run import simulate
# One driven cell -> one silent cell. Strong excitation must transmit; inhibition must not.
ptr=np.array([0,1,1],np.int32);dest=np.array([1],np.int32);weight=np.array([100.],np.float32)
inputs=np.array([0],np.int32);blocked=np.zeros(2,np.bool_)
a,events=simulate(ptr,dest,weight,np.array([1,1],np.int8),inputs,150.,blocked,1)
b,events2=simulate(ptr,dest,weight,np.array([-1,1],np.int8),inputs,150.,blocked,1)
blocked[0]=True
c,events3=simulate(ptr,dest,weight,np.array([1,1],np.int8),inputs,150.,blocked,1)
assert events==events2==events3>0
assert a[:,1].sum()>0 and b[:,1].sum()==c[:,1].sum()==0
assert np.array_equal(a[:,0],b[:,0]) and np.array_equal(a[:,0],c[:,0])
assert not a[:5].any(), 'No activity before the stimulus'
# A recurrent silent network cannot spontaneously generate activity from rest.
z,_=simulate(np.array([0,1,2],np.int32),np.array([1,0],np.int32),np.array([100.,100.],np.float32),np.ones(2,np.int8),np.array([],np.int32),0.,np.zeros(2,np.bool_),1)
assert not z.any()
print('PASS: excitatory transmission, inhibitory sign, blocked output, paired input, quiet baseline, silent recurrence')

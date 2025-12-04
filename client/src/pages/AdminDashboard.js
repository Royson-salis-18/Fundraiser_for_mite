import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventsAPI, adminAPI } from '../services/api';
import appLogo from '../1630654323517.jpg';
import TopNav from '../components/TopNav';
import ProfileOverlay from '../components/ProfileOverlay';
import SettingsOverlay from '../components/SettingsOverlay';

const AdminDashboard = ({ user, setUser, handleLogout }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalStudents: 0, totalPayments: 0 });
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPayment, setNewPayment] = useState({ type: 'optional', title: '', description: '', poster: '', amount: 0, targetClass: '', payeeName: '', payeeUpiId: '' });
  const [createErrors, setCreateErrors] = useState({});
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch events from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const events = await eventsAPI.getAll();
        setPayments(events || []);
        
        // Load admin stats
        try {
          const summary = await adminAPI.getPaymentSummary();
          if (summary && !summary.error) {
            setStats({
              totalStudents: summary.totalStudents || 0,
              totalPayments: summary.totalPaymentsReceived || 0
            });
          }
        } catch (error) {
          console.error('Failed to load stats:', error);
        }
      } catch (error) {
        console.error('Failed to load events:', error);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleEdit = (payment) => {
    setSelectedPayment(payment);
    setShowEditModal(true);
  };

  const handleUpdateEvent = async () => {
    try {
      const eventId = selectedPayment._id || selectedPayment.id;
      const result = await eventsAPI.update(eventId, selectedPayment);
      
      if (result.error) {
        alert('Failed to update event: ' + result.error);
        return;
      }

      // Refresh events list
      const events = await eventsAPI.getAll();
      setPayments(events || []);
      setShowEditModal(false);
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update event. Please try again.');
    }
  };

  const mandatoryPayments = payments.filter((p) => p.type === 'mandatory');
  const optionalEvents = payments.filter((p) => p.type === 'optional');

  const handleOpenCreate = () => {
    setNewPayment({ type: 'optional', title: '', description: '', poster: '', amount: 0, targetClass: '', payeeName: '', payeeUpiId: '' });
    setCreateErrors({});
    setShowCreateModal(true);
  };

  const validateNew = () => {
    const errors = {};
    if (!newPayment.title.trim()) errors.title = 'Title is required';
    if (!newPayment.targetClass.trim()) errors.targetClass = 'Target class is required';
    if (!newPayment.amount || Number(newPayment.amount) <= 0) errors.amount = 'Amount must be greater than 0';
    if (newPayment.type === 'optional') {
      if (!newPayment.payeeName.trim()) errors.payeeName = 'Payee name is required';
      if (!newPayment.payeeUpiId.trim()) errors.payeeUpiId = 'Payee UPI ID is required';
    }
    return errors;
  };

  const handleCreateEvent = async () => {
    const errors = validateNew();
    setCreateErrors(errors);
    if (Object.keys(errors).length) return;
    
    try {
      const result = await eventsAPI.create(newPayment);
      
      if (result.error) {
        alert('Failed to create event: ' + result.error);
        return;
      }

      // Refresh events list
      const events = await eventsAPI.getAll();
      setPayments(events || []);
      setShowCreateModal(false);
      
      // Reset form
      setNewPayment({ type: 'optional', title: '', description: '', poster: '', amount: 0, targetClass: '', payeeName: '', payeeUpiId: '' });
    } catch (error) {
      console.error('Create error:', error);
      alert('Failed to create event. Please try again.');
    }
  };

  return (
    <div className="page">
      <TopNav
        logoSrc={appLogo}
        title="MITE Admin Dashboard"
        titleTo="/admin-dashboard"
        subtitle="Manage fees and fundraising events"
        links={[
          { to: '/payment-confirmation', label: 'Payment Confirmation' },
        ]}
        extraRight={(
          <>
            <button className="btn btn-outline" onClick={() => setShowProfile(true)}>Profile</button>
            <button className="btn btn-outline" onClick={() => setShowSettings(true)}>Settings</button>
          </>
        )}
        onLogout={() => { handleLogout(); navigate('/login'); }}
      />
      <main className="container wide">
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading events...</p>
          </div>
        )}
        {!loading && (
        <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
          <div className="card">
            <h2 style={{ color: '#EF7100' }}>Mandatory Payments</h2>
            <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{mandatoryPayments.length}</p>
          </div>
          <div className="card">
            <h2 style={{ color: '#EF7100' }}>Optional Events</h2>
            <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{optionalEvents.length}</p>
          </div>
          <div className="card">
            <h2 style={{ color: '#EF7100' }}>Total Students Enrolled</h2>
            <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{stats.totalStudents}</p>
          </div>
          <div className="card">
            <h2 style={{ color: '#EF7100' }}>Payments Received</h2>
            <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{stats.totalPayments}</p>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>All Payments & Events</h2>
            <button className="btn btn-accent" onClick={handleOpenCreate}>Create New</button>
          </div>

          <h3 style={{ color: '#1A4E9B', marginBottom: '10px' }}>Mandatory Fees & Funds</h3>
          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {mandatoryPayments.map((payment) => (
              <div key={payment.id} className="card">
                <img src={payment.poster} alt={payment.title} className="cover" />
                <div style={{ padding: 0, marginTop: 12 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{payment.title}</h3>
                  <p style={{ color: '#6B7280', marginBottom: '10px' }}>{payment.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1A4E9B', margin: 0 }}>₹{payment.amount}</p>
                    <button onClick={() => handleEdit(payment)} className="btn btn-outline">Edit</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ color: '#1A4E9B', marginBottom: '10px' }}>Optional Events & Fundraisers</h3>
          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {optionalEvents.map((payment) => (
              <div key={payment.id} className="card">
                <img src={payment.poster} alt={payment.title} className="cover" />
                <div style={{ padding: 0, marginTop: 12 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{payment.title}</h3>
                  <p style={{ color: '#6B7280', marginBottom: '10px' }}>{payment.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1A4E9B', margin: 0 }}>₹{payment.amount}</p>
                    <button onClick={() => handleEdit(payment)} className="btn btn-outline">Edit</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </>
        )}
      </main>

      {showProfile && (
        <ProfileOverlay user={user} setUser={setUser} onClose={() => setShowProfile(false)} />
      )}
      {showSettings && (
        <SettingsOverlay user={user} onClose={() => setShowSettings(false)} />
      )}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem 0' }}>
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '10px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Edit Payment/Event</h2>
            <p style={{ marginBottom: '20px' }}>Update the fee, fund, or event details</p>
            <div className="field">
              <label className="label">Payment Type</label>
              <input className="input" type="text" value={selectedPayment?.type || ''} readOnly />
            </div>
            <div className="field">
              <label className="label">Event Title</label>
              <input className="input" type="text" value={selectedPayment?.title || ''} onChange={(e) => setSelectedPayment({ ...selectedPayment, title: e.target.value })} />
            </div>
            <div className="field">
              <label className="label">Description</label>
              <textarea className="textarea" value={selectedPayment?.description || ''} onChange={(e) => setSelectedPayment({ ...selectedPayment, description: e.target.value })} />
            </div>
            <div className="field">
              <label className="label">Poster URL (optional)</label>
              <input className="input" type="text" value={selectedPayment?.poster || ''} onChange={(e) => setSelectedPayment({ ...selectedPayment, poster: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label className="label">Amount (₹)</label>
                <input className="input" type="number" value={selectedPayment?.amount || 0} onChange={(e) => setSelectedPayment({ ...selectedPayment, amount: Number(e.target.value) })} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">Target Class</label>
                <input className="input" type="text" value={selectedPayment?.targetClass || ''} onChange={(e) => setSelectedPayment({ ...selectedPayment, targetClass: e.target.value })} />
              </div>
            </div>
            {selectedPayment?.type === 'optional' && (
              <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label className="label">Payee Name</label>
                  <input className="input" type="text" value={selectedPayment.payeeName || ''} onChange={(e) => setSelectedPayment({ ...selectedPayment, payeeName: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">Payee UPI ID</label>
                  <input className="input" type="text" value={selectedPayment.payeeUpiId || ''} onChange={(e) => setSelectedPayment({ ...selectedPayment, payeeUpiId: e.target.value })} />
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowEditModal(false)} className="btn btn-outline">Cancel</button>
              <button onClick={handleUpdateEvent} className="btn btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem 0' }}>
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '10px', maxWidth: '540px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Create Payment/Event</h2>
            <p style={{ marginBottom: '20px' }}>Fill out all required fields to add a new item.</p>
            <div className="field">
              <label className="label">Type</label>
              <select className="select" value={newPayment.type} onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value })}>
                <option value="mandatory">Mandatory</option>
                <option value="optional">Optional</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Title</label>
              <input className="input" type="text" value={newPayment.title} onChange={(e) => setNewPayment({ ...newPayment, title: e.target.value })} />
              {createErrors.title && <p style={{ color: 'red', marginTop: 6 }}>{createErrors.title}</p>}
            </div>
            <div className="field">
              <label className="label">Description</label>
              <textarea className="textarea" value={newPayment.description} onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })} />
            </div>
            <div className="field">
              <label className="label">Poster URL (optional)</label>
              <input className="input" type="text" value={newPayment.poster} onChange={(e) => setNewPayment({ ...newPayment, poster: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label className="label">Amount (₹)</label>
                <input className="input" type="number" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} />
                {createErrors.amount && <p style={{ color: 'red', marginTop: 6 }}>{createErrors.amount}</p>}
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">Target Class</label>
                <input className="input" type="text" value={newPayment.targetClass} onChange={(e) => setNewPayment({ ...newPayment, targetClass: e.target.value })} />
                {createErrors.targetClass && <p style={{ color: 'red', marginTop: 6 }}>{createErrors.targetClass}</p>}
              </div>
            </div>
            {newPayment.type === 'optional' && (
              <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label className="label">Payee Name</label>
                  <input className="input" type="text" value={newPayment.payeeName} onChange={(e) => setNewPayment({ ...newPayment, payeeName: e.target.value })} />
                  {createErrors.payeeName && <p style={{ color: 'red', marginTop: 6 }}>{createErrors.payeeName}</p>}
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">Payee UPI ID</label>
                  <input className="input" type="text" value={newPayment.payeeUpiId} onChange={(e) => setNewPayment({ ...newPayment, payeeUpiId: e.target.value })} />
                  {createErrors.payeeUpiId && <p style={{ color: 'red', marginTop: 6 }}>{createErrors.payeeUpiId}</p>}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-outline">Cancel</button>
              <button onClick={handleCreateEvent} className="btn btn-primary">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  MapPin,
  Bell,
  MessageCircle,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Users,
  User,
  X,
  Send
} from 'lucide-react';
import { eventService } from '../services/eventService';
import { studentService } from '../services/studentService';
import { Event, CreateEventData } from '../types/event';
import { Student } from '../types/student';

const EventManagement: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [notificationMode, setNotificationMode] = useState<'classes' | 'students'>('classes');

  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    event_type: 'PTM',
    event_date: new Date().toISOString().split('T')[0],
    event_time: '10:00',
    reminder: 'On time'
  });

  useEffect(() => {
    loadEvents();
    loadStudents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventService.getEventsByMonth(
        currentDate.getFullYear(),
        currentDate.getMonth()
      );
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await studentService.getAllStudents();
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const handleCreateEvent = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await eventService.createEvent(formData);
      
      setSuccess('Event created successfully!');
      resetForm();
      await loadEvents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;

    try {
      setSaving(true);
      setError(null);
      
      await eventService.updateEvent(selectedEvent.id, formData);
      
      setSuccess('Event updated successfully!');
      setIsEditing(false);
      setSelectedEvent(null);
      resetForm();
      await loadEvents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await eventService.deleteEvent(eventId);
      setSuccess('Event deleted successfully!');
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(null);
        setIsEditing(false);
        resetForm();
      }
      await loadEvents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type,
      event_date: event.event_date,
      event_time: event.event_time,
      reminder: event.reminder
    });
    setIsEditing(true);
    setIsCreating(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'PTM',
      event_date: new Date().toISOString().split('T')[0],
      event_time: '10:00',
      reminder: 'On time'
    });
    setIsCreating(false);
    setIsEditing(false);
    setSelectedEvent(null);
  };

  const handleSendNotification = async () => {
    try {
      setSendingNotification(true);
      setError(null);

      let recipients: Student[] = [];

      if (notificationMode === 'classes') {
        recipients = students.filter(student => selectedClasses.includes(student.class));
      } else {
        recipients = students.filter(student => selectedStudents.includes(student.id));
      }

      if (recipients.length === 0) {
        setError('Please select at least one class or student to send notifications');
        return;
      }

      const message = `📅 Event Reminder: ${formData.title}\n📍 Date: ${new Date(formData.event_date).toLocaleDateString()}\n⏰ Time: ${formData.event_time}\n📝 ${formData.description || 'No description provided'}`;
      
      // Simulate sending WhatsApp notifications
      const phoneNumbers = recipients.map(student => student.phone).join(', ');
      
      // In a real application, you would integrate with WhatsApp Business API
      console.log('Sending WhatsApp notifications to:', phoneNumbers);
      console.log('Message:', message);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(`Notification sent successfully to ${recipients.length} recipient(s)!`);
      setShowNotificationModal(false);
      setSelectedClasses([]);
      setSelectedStudents([]);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setSendingNotification(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      'PTM': 'bg-yellow-200 text-yellow-800',
      'Exam': 'bg-blue-200 text-blue-800',
      'Holiday': 'bg-red-200 text-red-800',
      'Meeting': 'bg-green-200 text-green-800',
      'Workshop': 'bg-purple-200 text-purple-800',
      'Sports': 'bg-orange-200 text-orange-800',
      'Cultural': 'bg-pink-200 text-pink-800',
      'Other': 'bg-gray-200 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.Other;
  };

  const getUniqueClasses = () => {
    return [...new Set(students.map(student => student.class))].sort();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(event => event.event_date === dateKey);
      
      days.push(
        <div key={day} className="h-20 border border-gray-200 p-1 bg-white hover:bg-gray-50 transition-colors duration-150">
          <div className="text-sm font-medium text-gray-900 mb-1">{day}</div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event, index) => (
              <div
                key={event.id}
                className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer ${getEventTypeColor(event.event_type)}`}
                onClick={() => handleEditEvent(event)}
                title={event.title}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
          <p className="text-gray-600 mt-1">Create and manage ALC events and notifications.</p>
        </div>
        <button
          onClick={() => {
            if (isCreating) {
              resetForm();
            } else {
              setIsCreating(true);
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>{isCreating ? 'Cancel' : 'Create Event'}</span>
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Calendar and Event List */}
        <div className="space-y-6">
          {/* Calendar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-700 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>
          </div>

          {/* Event List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event List</h3>
            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No events found for this month</p>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                        {event.event_type}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(event.event_date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors duration-150"
                        title="Edit Event"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-150"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Event Creation/Edit Form */}
        {isCreating && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {isEditing ? 'Edit Event' : 'Create Event'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PTM">PTM</option>
                  <option value="Exam">Exam</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Sports">Sports</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter event description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={formData.event_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, event_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reminder
                </label>
                <select
                  value={formData.reminder}
                  onChange={(e) => setFormData(prev => ({ ...prev, reminder: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="On time">On time</option>
                  <option value="15 minutes before">15 minutes before</option>
                  <option value="30 minutes before">30 minutes before</option>
                  <option value="1 hour before">1 hour before</option>
                  <option value="1 day before">1 day before</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={resetForm}
                  disabled={saving}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-150 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={isEditing ? handleUpdateEvent : handleCreateEvent}
                  disabled={saving || !formData.title}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{isEditing ? 'Updating...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <span>{isEditing ? 'Update' : 'Save'}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Send Notification Button */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowNotificationModal(true)}
                disabled={!formData.title}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Send Notification</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowNotificationModal(false)}></div>

            <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Send WhatsApp Notification</h3>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Notification Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Send to:
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="classes"
                        checked={notificationMode === 'classes'}
                        onChange={(e) => setNotificationMode(e.target.value as 'classes' | 'students')}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Classes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="students"
                        checked={notificationMode === 'students'}
                        onChange={(e) => setNotificationMode(e.target.value as 'classes' | 'students')}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Individual Students</span>
                    </label>
                  </div>
                </div>

                {/* Class Selection */}
                {notificationMode === 'classes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Classes:
                    </label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                      {getUniqueClasses().map((className) => (
                        <label key={className} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedClasses.includes(className)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedClasses(prev => [...prev, className]);
                              } else {
                                setSelectedClasses(prev => prev.filter(c => c !== className));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {className} ({students.filter(s => s.class === className).length} students)
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Student Selection */}
                {notificationMode === 'students' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Students:
                    </label>
                    <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                      {students.map((student) => (
                        <label key={student.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudents(prev => [...prev, student.id]);
                              } else {
                                setSelectedStudents(prev => prev.filter(s => s !== student.id));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {student.name} ({student.class}) - {student.phone}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Preview:
                  </label>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm text-gray-700">
                    📅 Event Reminder: {formData.title}<br />
                    📍 Date: {new Date(formData.event_date).toLocaleDateString()}<br />
                    ⏰ Time: {formData.event_time}<br />
                    📝 {formData.description || 'No description provided'}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowNotificationModal(false)}
                    disabled={sendingNotification}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-150 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendNotification}
                    disabled={sendingNotification || (notificationMode === 'classes' ? selectedClasses.length === 0 : selectedStudents.length === 0)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-150 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {sendingNotification ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Notification</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagement;
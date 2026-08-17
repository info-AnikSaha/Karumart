import { toast } from 'sonner';

export type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'card';

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
}

/**
 * Simulations for real-world payment gateways in Bangladesh.
 * In a production environment, these would call secure backend endpoints 
 * that interact with bKash/Nagad/SSLCommerz APIs.
 */
export const PaymentService = {
  /**
   * Simulates bKash Payment Flow
   */
  async processBkashPayment(amount: number, orderId: string): Promise<PaymentResponse> {
    return new Promise((resolve) => {
      toast.info('বিকাশ পেমেন্ট গেটওয়েতে রিডাইরেক্ট করা হচ্ছে...', { duration: 2000 });
      
      // Simulate real gateway latency
      setTimeout(() => {
        // In reality, this would open a bKash popup or redirect to a payment URL
        console.log(`Processing bKash payment for ৳${amount} (Order: ${orderId})`);
        
        // Mocking a successful payment
        resolve({
          success: true,
          transactionId: `BK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        });
      }, 3000);
    });
  },

  /**
   * Simulates Nagad Payment Flow
   */
  async processNagadPayment(amount: number, orderId: string): Promise<PaymentResponse> {
    return new Promise((resolve) => {
      toast.info('নগদ পেমেন্ট গেটওয়েতে রিডাইরেক্ট করা হচ্ছে...', { duration: 2000 });
      
      setTimeout(() => {
        console.log(`Processing Nagad payment for ৳${amount} (Order: ${orderId})`);
        resolve({
          success: true,
          transactionId: `NG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        });
      }, 3000);
    });
  },

  /**
   * Simulates SSLCommerz Payment Flow (Cards/Net Banking)
   */
  async processSSLCommerzPayment(amount: number, orderId: string): Promise<PaymentResponse> {
    return new Promise((resolve) => {
      toast.info('SSLCommerz নিরাপদ পেমেন্ট পেজে রিডাইরেক্ট করা হচ্ছে...', { duration: 2000 });
      
      setTimeout(() => {
        console.log(`Processing SSLCommerz payment for ৳${amount} (Order: ${orderId})`);
        resolve({
          success: true,
          transactionId: `SSL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        });
      }, 3500);
    });
  },

  /**
   * Unified Payment Handler
   */
  async processPayment(method: PaymentMethod, amount: number, orderId: string): Promise<PaymentResponse> {
    switch (method) {
      case 'bkash':
        return this.processBkashPayment(amount, orderId);
      case 'nagad':
        return this.processNagadPayment(amount, orderId);
      case 'card':
        return this.processSSLCommerzPayment(amount, orderId);
      case 'cod':
        return { success: true };
      default:
        return { success: false, error: 'Invalid payment method' };
    }
  }
};

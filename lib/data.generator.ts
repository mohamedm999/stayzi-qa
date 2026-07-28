import { faker } from '@faker-js/faker/locale/en';

// Seed for consistent data across test runs (remove for random each time)
faker.seed(42);

export class DataGenerator {
  /**
   * Generate a test user for registration
   */
  static user(overrides?: Partial<GeneratedUser>): GeneratedUser {
    const ts = Date.now();
    const rand = faker.string.alphanumeric(6).toLowerCase();
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: `testuser_${rand}${ts}@testmail.com`,
      password: `Test${faker.string.alphanumeric(8)}!1`,
      phone: `+2126${faker.string.numeric(8)}`,
      birthDate: '1995-06-15',
      ...overrides,
    };
  }

  /**
   * Generate a property listing
   */
  static property(overrides?: Partial<GeneratedProperty>): GeneratedProperty {
    return {
      title: `${faker.location.city()} ${faker.word.adjective()} Apartment`,
      description: faker.lorem.paragraphs(3),
      type: faker.helpers.arrayElement(['apartment', 'house', 'villa', 'studio', 'chalet']),
      address: faker.location.streetAddress(),
      city: faker.helpers.arrayElement(['Casablanca', 'Marrakech', 'Tangier', 'Fes', 'Agadir', 'Rabat']),
      country: 'Morocco',
      pricePerNight: faker.number.int({ min: 200, max: 2000 }),
      currency: 'MAD',
      bedrooms: faker.number.int({ min: 1, max: 5 }),
      bathrooms: faker.number.int({ min: 1, max: 3 }),
      guests: faker.number.int({ min: 1, max: 8 }),
      amenities: faker.helpers.arrayElements([
        'WiFi', 'Pool', 'Parking', 'Kitchen', 'AC',
        'Washer', 'TV', 'Gym', 'Balcony', 'Heating',
      ], { min: 3, max: 7 }),
      ...overrides,
    };
  }

  /**
   * Generate a booking
   */
  static booking(overrides?: Partial<GeneratedBooking>): GeneratedBooking {
    const checkIn = faker.date.soon({ days: 30 });
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + faker.number.int({ min: 1, max: 7 }));

    return {
      checkIn: checkIn.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0],
      guests: faker.number.int({ min: 1, max: 4 }),
      message: faker.lorem.sentence(),
      ...overrides,
    };
  }

  /**
   * Generate a review
   */
  static review(overrides?: Partial<GeneratedReview>): GeneratedReview {
    return {
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: faker.lorem.paragraph(),
      ...overrides,
    };
  }

  /**
   * Generate a simple random string (for unique test data)
   */
  static uniqueId(prefix = 'test'): string {
    return `${prefix}-${faker.string.alphanumeric(8).toLowerCase()}`;
  }

  /**
   * Generate a random email that won't collide
   */
  static uniqueEmail(domain = 'testmail.com'): string {
    return `${faker.string.alphanumeric(10).toLowerCase()}@${domain}`;
  }
}

// --- Type Definitions ---

export interface GeneratedUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  birthDate: string;
}

export interface GeneratedProperty {
  title: string;
  description: string;
  type: string;
  address: string;
  city: string;
  country: string;
  pricePerNight: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  guests: number;
  amenities: string[];
}

export interface GeneratedBooking {
  checkIn: string;
  checkOut: string;
  guests: number;
  message: string;
}

export interface GeneratedReview {
  rating: number;
  comment: string;
}
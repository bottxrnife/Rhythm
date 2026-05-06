import { ROUTINES, CATEGORIES, getRoutinesByCategory, getSuggestedRoutine } from '../routines';

describe('routines data', () => {
  describe('ROUTINES', () => {
    it('has 20 routines', () => {
      expect(ROUTINES).toHaveLength(20);
    });

    it('every routine has required fields', () => {
      for (const routine of ROUTINES) {
        expect(routine.id).toBeTruthy();
        expect(routine.title).toBeTruthy();
        expect(routine.description).toBeTruthy();
        expect(routine.icon).toBeTruthy();
        expect(routine.category).toBeTruthy();
        expect(routine.credits).toMatch(/^\+\d+\.\d{2}$/);
        expect(routine.steps.length).toBeGreaterThanOrEqual(3);
        expect(routine.verifyHint).toBeTruthy();
      }
    });

    it('every routine has a unique id', () => {
      const ids = ROUTINES.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every routine belongs to a valid category', () => {
      const categoryLabels = CATEGORIES.map((c) => c.label);
      for (const routine of ROUTINES) {
        expect(categoryLabels).toContain(routine.category);
      }
    });

    it('sponsored routines have a sponsorName', () => {
      for (const routine of ROUTINES) {
        if (routine.sponsored) {
          expect(routine.sponsorName).toBeTruthy();
        }
      }
    });

    it('credits are parseable as positive numbers', () => {
      for (const routine of ROUTINES) {
        const value = parseFloat(routine.credits.replace('+', ''));
        expect(value).toBeGreaterThan(0);
      }
    });
  });

  describe('CATEGORIES', () => {
    it('has 7 categories', () => {
      expect(CATEGORIES).toHaveLength(7);
    });

    it('every category has required fields', () => {
      for (const cat of CATEGORIES) {
        expect(cat.label).toBeTruthy();
        expect(cat.icon).toBeTruthy();
        expect(cat.count).toBeGreaterThanOrEqual(1);
      }
    });

    it('category counts match actual routine counts', () => {
      for (const cat of CATEGORIES) {
        const actual = ROUTINES.filter((r) => r.category === cat.label).length;
        expect(actual).toBe(cat.count);
      }
    });
  });

  describe('getRoutinesByCategory', () => {
    it('returns routines for Hygiene', () => {
      const hygiene = getRoutinesByCategory('Hygiene');
      expect(hygiene.length).toBe(3);
      expect(hygiene.every((r) => r.category === 'Hygiene')).toBe(true);
    });

    it('returns routines for Medication', () => {
      const meds = getRoutinesByCategory('Medication');
      expect(meds.length).toBe(6);
    });

    it('returns empty array for unknown category', () => {
      expect(getRoutinesByCategory('Unknown')).toEqual([]);
    });
  });

  describe('getSuggestedRoutine', () => {
    it('returns the first routine (Hydrate)', () => {
      const suggested = getSuggestedRoutine();
      expect(suggested.id).toBe('hydrate');
    });
  });
});
